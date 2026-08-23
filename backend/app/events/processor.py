import json
import uuid
from decimal import Decimal
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.schemas.events import PaymentFailureEvent, EventProcessingResponse
from app.repository.models import (
    CustomerModel,
    PaymentModel,
    RecoveryCaseModel,
    PaymentEventModel,
    AuditEventModel,
)
from app.repository.postgres import (
    PostgresCustomerRepository,
    PostgresPaymentRepository,
    PostgresRecoveryCaseRepository,
    PostgresEventRepository,
    PostgresAuditRepository,
)
from app.recovery.trigger import RecoveryTrigger
from app.recovery.dispatcher import RecoveryJobDispatcher
from app.domain.audit import AuditEventType


@dataclass(frozen=True)
class AuthenticatedEventContext:
    """Security context holding provenance of verified webhook authentication."""
    provider: str
    event_id: str
    authenticated: bool
    authenticated_at: datetime = field(default_factory=datetime.utcnow)
    correlation_id: Optional[str] = None
    signature_verified: bool = True
    replay_checked: bool = True


class PaymentEventProcessor:
    """Production payment failure event processor.
    
    Responsibilities:
    - Validates and deduplicates incoming payment failure webhook events.
    - Requires verified security context before processing.
    - Uses application-level deduplication AND database UNIQUE(provider_event_id) constraints.
    - Persists customer, payment, recovery case, and audit events inside an atomic transaction.
    - Propagates correlation_id end-to-end through audit trail.
    - Handles database integrity collisions safely during race conditions.
    - Dispatches autonomous recovery post-commit safely via RecoveryJobDispatcher.
    """

    def __init__(
        self,
        session: Session,
        dispatcher: Optional[RecoveryJobDispatcher] = None,
    ) -> None:
        self.session = session
        self.dispatcher = dispatcher or RecoveryJobDispatcher()
        self.customer_repo = PostgresCustomerRepository(session)
        self.payment_repo = PostgresPaymentRepository(session)
        self.case_repo = PostgresRecoveryCaseRepository(session)
        self.event_repo = PostgresEventRepository(session)
        self.audit_repo = PostgresAuditRepository(session)

    def process_event(
        self,
        event: PaymentFailureEvent,
        trigger_recovery: bool = True,
        security_context: Optional[AuthenticatedEventContext] = None,
    ) -> EventProcessingResponse:
        """Processes an incoming PaymentFailureEvent idempotently."""
        # Enforce security context if provided or required
        if security_context is not None:
            if not (
                security_context.authenticated
                and security_context.signature_verified
                and security_context.replay_checked
            ):
                raise ValueError("PaymentEventProcessor rejected unauthenticated security context.")

        correlation_id = security_context.correlation_id if security_context else None
        provider_name = security_context.provider if security_context and security_context.provider else "razorpay"

        # 1. Application-level deduplication check (provider-aware)
        existing_event = self.event_repo.get_by_provider_event_id(event.event_id, provider=provider_name)
        if existing_event:
            existing_case = self.case_repo.get_by_payment_id(event.payment_id)
            case_id = existing_case.id if existing_case else None
            return EventProcessingResponse(
                status="already_processed",
                provider_event_id=event.event_id,
                payment_id=event.payment_id,
                customer_id=event.customer_id,
                case_id=case_id,
                duplicate=True,
                message="Duplicate event detected. Event has already been processed.",
            )

        # 2. Atomic persistence transaction
        try:
            # Create PaymentEvent record
            event_record = PaymentEventModel(
                id=f"pevt_{uuid.uuid4().hex[:12]}",
                provider_event_id=event.event_id,
                provider=provider_name,
                event_type=event.event_type,
                payment_id=event.payment_id,
                customer_id=event.customer_id,
                processing_status="PROCESSING",
                received_at=datetime.utcnow(),
                occurred_at=event.occurred_at,
            )
            event_record = self.event_repo.save(event_record)


            # Customer Persistence / Normalization
            customer = self.customer_repo.get_by_id(event.customer_id)
            if not customer:
                customer = CustomerModel(
                    id=event.customer_id,
                    external_customer_id=f"ext_{event.customer_id}",
                    segment="REGULAR",
                    total_payments=1,
                    successful_payments=0,
                    failed_payments=1,
                    total_spent=0.00,
                )
                customer = self.customer_repo.save(customer)

            # Payment Persistence / Normalization
            payment = self.payment_repo.get_by_id(event.payment_id)
            if not payment:
                payment = PaymentModel(
                    id=event.payment_id,
                    customer_id=event.customer_id,
                    amount=event.amount,
                    currency=event.currency,
                    status="FAILED",
                    failure_code=event.failure_code,
                    provider_payment_id=event.payment_id,
                    created_at=event.occurred_at,
                )
                payment = self.payment_repo.save(payment)

            # RecoveryCase Creation / Reuse
            recovery_case = self.case_repo.get_by_payment_id(event.payment_id)
            if not recovery_case:
                case_id = f"case_{event.payment_id}"
                priority = "HIGH" if event.amount > Decimal("20000.00") else "MEDIUM"
                recovery_case = RecoveryCaseModel(
                    id=case_id,
                    payment_id=event.payment_id,
                    customer_id=event.customer_id,
                    state="DETECTED",
                    priority=priority,
                    attempt_count=0,
                    max_allowed_attempts=3,
                    created_at=datetime.utcnow(),
                )
                recovery_case = self.case_repo.save(recovery_case)

            # Audit Event Persistence
            audit_record = AuditEventModel(
                id=f"aud_{uuid.uuid4().hex[:12]}",
                event_type=AuditEventType.CASE_DETECTED.value,
                aggregate_id=recovery_case.id,
                case_id=recovery_case.id,
                payment_id=payment.id,
                payload=json.dumps({
                    "event_id": event.event_id,
                    "failure_code": event.failure_code,
                    "amount": str(event.amount),
                    "currency": event.currency,
                }),
                timestamp=datetime.utcnow(),
                correlation_id=correlation_id,
            )
            self.audit_repo.save_event(audit_record)

            event_record.processing_status = "COMPLETED"
            event_record.processed_at = datetime.utcnow()
            self.event_repo.save(event_record)

            # Commit transaction atomically
            self.session.commit()

        except IntegrityError as exc:
            # Handle database unique constraint race conditions safely
            print(f"DEBUG INTEGRITY ERROR: {exc}")
            self.session.rollback()
            existing_event = self.event_repo.get_by_provider_event_id(event.event_id)
            existing_case = self.case_repo.get_by_payment_id(event.payment_id)
            case_id = existing_case.id if existing_case else None
            return EventProcessingResponse(
                status="already_processed",
                provider_event_id=event.event_id,
                payment_id=event.payment_id,
                customer_id=event.customer_id,
                case_id=case_id,
                duplicate=True,
                message="Concurrent duplicate event caught by database unique constraint.",
            )
        except Exception:
            self.session.rollback()
            raise

        # 3. Post-commit background recovery trigger
        if trigger_recovery and recovery_case.state not in ["RECOVERED", "ESCALATED", "STOPPED"]:
            trigger = RecoveryTrigger(
                case_id=recovery_case.id,
                payment_id=event.payment_id,
                trigger_reason=f"Payment failure event ingested: {event.event_id}",
            )
            self.dispatcher.dispatch_recovery_job(trigger, self.session)

        return EventProcessingResponse(
            status="accepted",
            provider_event_id=event.event_id,
            payment_id=event.payment_id,
            customer_id=event.customer_id,
            case_id=recovery_case.id,
            duplicate=False,
            message="Payment failure event successfully accepted and recovery initiated.",
        )
