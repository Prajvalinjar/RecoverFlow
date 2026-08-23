from typing import Optional
from datetime import datetime
import json
import uuid
from sqlalchemy.orm import Session

from app.recovery.trigger import RecoveryTrigger
from app.recovery.service import RecoveryLoopService, AutonomousRecoveryResult
from app.recovery.retry_policy import RecoveryRetryPolicy
from app.recovery.reconciliation import RecoveryReconciliationService
from app.domain.recovery_job import RecoveryJob, RecoveryJobStatus
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.execution_result import ExecutionResult, ProviderExecutionStatus
from app.domain.customer import CustomerContext
from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.recovery_case import RecoveryCase, CaseState, CasePriority
from app.simulation.scenarios import SimulationScenario
from app.repository.postgres import (
    PostgresRecoveryCaseRepository,
    PostgresPaymentRepository,
    PostgresCustomerRepository,
    PostgresRecoveryAttemptRepository,
    PostgresAuditRepository,
    PostgresRecoveryExecutionRepository,
    PostgresRecoveryJobRepository,
)
from app.repository.models import (
    RecoveryAttemptModel,
    AuditEventModel,
    RecoveryJobModel,
    RecoveryExecutionModel,
)


class RecoveryJobDispatcher:
    """Upgraded background-safe recovery job dispatcher with persistent job tracking and retry resilience."""

    def __init__(self, service: Optional[RecoveryLoopService] = None, retry_policy: Optional[RecoveryRetryPolicy] = None) -> None:
        self.service = service or RecoveryLoopService()
        self.retry_policy = retry_policy or RecoveryRetryPolicy()
        self.reconciler = RecoveryReconciliationService()

    def dispatch_recovery_job(self, trigger: RecoveryTrigger, session: Session) -> Optional[AutonomousRecoveryResult]:
        """Dispatches recovery loop for a triggered case using persistent job and execution tracking."""
        case_repo = PostgresRecoveryCaseRepository(session)
        payment_repo = PostgresPaymentRepository(session)
        customer_repo = PostgresCustomerRepository(session)
        attempt_repo = PostgresRecoveryAttemptRepository(session)
        audit_repo = PostgresAuditRepository(session)
        execution_repo = PostgresRecoveryExecutionRepository(session)
        job_repo = PostgresRecoveryJobRepository(session)

        case_model = case_repo.get_by_id(trigger.case_id)
        if not case_model:
            return None

        payment_model = payment_repo.get_by_id(trigger.payment_id)
        if not payment_model:
            return None

        customer_model = customer_repo.get_by_id(case_model.customer_id)
        if not customer_model:
            return None

        correlation_id = f"corr_{uuid.uuid4().hex[:12]}"

        # Persist / Enqueue RecoveryJob record
        job_id = f"job_{trigger.case_id}"
        job_model = job_repo.get_by_id(job_id)
        if not job_model:
            job_model = RecoveryJobModel(
                job_id=job_id,
                case_id=trigger.case_id,
                trigger_id=getattr(trigger, "event_id", None) or trigger.case_id,
                status="RUNNING",
                attempt_number=1,
                max_attempts=3,
                available_at=datetime.utcnow(),
                started_at=datetime.utcnow(),
                created_at=datetime.utcnow(),
                correlation_id=correlation_id,
            )
        else:
            job_model.status = "RUNNING"
            job_model.started_at = datetime.utcnow()
        job_repo.save(job_model)
        session.commit()

        # Convert ORM models to domain context objects
        domain_customer = CustomerContext(
            customer_id=customer_model.id,
            historical_success_count=customer_model.successful_payments,
            historical_failure_count=customer_model.failed_payments,
            average_payment_delay_hours=customer_model.average_payment_delay,
            previous_recovery_success_rate=customer_model.recovery_success_rate,
            customer_segment=customer_model.segment,
            total_spent=customer_model.total_spent,
        )

        failure_code_enum = FailureCode(payment_model.failure_code) if payment_model.failure_code else None
        domain_payment = Payment(
            payment_id=payment_model.id,
            customer_id=payment_model.customer_id,
            amount=payment_model.amount,
            currency=payment_model.currency,
            status=PaymentStatus(payment_model.status),
            failure_code=failure_code_enum,
            created_at=payment_model.created_at,
        )

        domain_case = RecoveryCase(
            case_id=case_model.id,
            payment_id=case_model.payment_id,
            customer_id=case_model.customer_id,
            amount_at_risk=case_model.payment.amount if case_model.payment else payment_model.amount,
            state=CaseState(case_model.state),
            priority=CasePriority(case_model.priority),
            detected_at=case_model.created_at,
            attempts_count=case_model.attempt_count,
            max_allowed_attempts=case_model.max_allowed_attempts,
            correlation_id=correlation_id,
        )

        try:
            # Execute autonomous recovery loop via existing RecoveryLoopService
            result: AutonomousRecoveryResult = self.service.run_autonomous_recovery(
                case=domain_case,
                payment=domain_payment,
                customer=domain_customer,
                max_cycles=3,
                simulation_scenario=SimulationScenario.CONTEXT_AWARE,
            )

            # Update persistent database models with final recovery results
            case_model.state = result.final_case.state.value
            case_model.attempt_count = result.final_case.attempts_count
            case_model.updated_at = result.final_case.updated_at
            if result.stop_reason:
                case_model.terminal_reason = result.stop_reason.value if hasattr(result.stop_reason, "value") else str(result.stop_reason)

            if result.is_recovered:
                payment_model.status = PaymentStatus.SUCCESS.value
                customer_model.successful_payments += 1
                customer_model.total_spent += result.overall_evaluation.amount_recovered

            case_repo.save(case_model)
            payment_repo.save(payment_model)
            customer_repo.save(customer_model)

            # Persist executed attempts and executions into DB
            for cycle in result.cycles:
                if cycle.execution and cycle.outcome:
                    attempt_model = RecoveryAttemptModel(
                        id=f"att_{cycle.execution.execution_id}",
                        case_id=case_model.id,
                        action_type=cycle.execution.action.action_type.value,
                        attempt_number=cycle.cycle_number,
                        execution_id=cycle.execution.execution_id,
                        idempotency_key=cycle.execution.idempotency_key,
                        status=cycle.execution.status.value,
                        outcome_status=cycle.outcome.status.value,
                        amount_recovered=cycle.outcome.recovered_amount,
                    )
                    attempt_repo.save(attempt_model)

                    exec_model = RecoveryExecutionModel(
                        execution_id=cycle.execution.execution_id,
                        case_id=case_model.id,
                        policy_decision_id=cycle.execution.policy_decision_id,
                        action_type=cycle.execution.action.action_type.value,
                        status=cycle.execution.status.value,
                        idempotency_key=cycle.execution.idempotency_key,
                        provider="SIMULATED_PROVIDER",
                        provider_reference=cycle.execution.provider_reference or f"ref_{cycle.execution.execution_id}",
                        amount=payment_model.amount,
                        currency=payment_model.currency,
                        dispatched_at=cycle.execution.started_at,
                        completed_at=cycle.execution.completed_at,
                        correlation_id=correlation_id,
                    )
                    execution_repo.save(exec_model)

            # Persist timeline audit events
            for audit_entry in result.audit_events:
                audit_model = AuditEventModel(
                    id=audit_entry.event_id,
                    event_type=audit_entry.event_type.value if hasattr(audit_entry.event_type, "value") else str(audit_entry.event_type),
                    aggregate_id=audit_entry.case_id,
                    case_id=case_model.id,
                    payment_id=payment_model.id,
                    payload=json.dumps(audit_entry.details),
                    timestamp=audit_entry.timestamp,
                    correlation_id=correlation_id,
                )
                audit_repo.save_event(audit_model)

            # Mark job completed
            job_model.status = "COMPLETED"
            job_model.completed_at = datetime.utcnow()
            job_repo.save(job_model)

            session.commit()
            return result

        except Exception as exc:
            job_model.status = "FAILED"
            job_model.last_error = str(exc)
            job_repo.save(job_model)
            session.commit()
            raise exc
