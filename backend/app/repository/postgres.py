from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.repository.interfaces import (
    CustomerRepository,
    PaymentRepository,
    RecoveryCaseRepository,
    RecoveryAttemptRepository,
    EventRepository,
    AuditRepository,
    RecoveryExecutionRepository,
    RecoveryJobRepository,
    ProviderRegistryRepository,
    ProviderOperationRepository,
)
from app.repository.models import (
    CustomerModel,
    PaymentModel,
    RecoveryCaseModel,
    RecoveryAttemptModel,
    PaymentEventModel,
    AuditEventModel,
    RecoveryExecutionModel,
    RecoveryJobModel,
    ProviderRegistryModel,
    ProviderOperationModel,
)


class PostgresCustomerRepository(CustomerRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, customer_id: str) -> Optional[CustomerModel]:
        return self.session.query(CustomerModel).filter(CustomerModel.id == customer_id).first()

    def save(self, customer: CustomerModel) -> CustomerModel:
        if customer in self.session:
            return customer
        return self.session.merge(customer)


class PostgresPaymentRepository(PaymentRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, payment_id: str) -> Optional[PaymentModel]:
        return self.session.query(PaymentModel).filter(PaymentModel.id == payment_id).first()

    def save(self, payment: PaymentModel) -> PaymentModel:
        if payment in self.session:
            return payment
        return self.session.merge(payment)

    def get_by_customer_id(self, customer_id: str) -> List[PaymentModel]:
        return self.session.query(PaymentModel).filter(PaymentModel.customer_id == customer_id).all()


class PostgresRecoveryCaseRepository(RecoveryCaseRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, case_id: str) -> Optional[RecoveryCaseModel]:
        return self.session.query(RecoveryCaseModel).filter(RecoveryCaseModel.id == case_id).first()

    def get_by_payment_id(self, payment_id: str) -> Optional[RecoveryCaseModel]:
        return self.session.query(RecoveryCaseModel).filter(RecoveryCaseModel.payment_id == payment_id).first()

    def save(self, case: RecoveryCaseModel) -> RecoveryCaseModel:
        if case in self.session:
            return case
        return self.session.merge(case)

    def list_active_cases(self) -> List[RecoveryCaseModel]:
        return self.session.query(RecoveryCaseModel).filter(
            RecoveryCaseModel.state.notin_(["RECOVERED", "ESCALATED", "STOPPED"])
        ).all()

    def list_all_cases(self) -> List[RecoveryCaseModel]:
        return self.session.query(RecoveryCaseModel).all()


class PostgresRecoveryAttemptRepository(RecoveryAttemptRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, attempt_id: str) -> Optional[RecoveryAttemptModel]:
        return self.session.query(RecoveryAttemptModel).filter(RecoveryAttemptModel.id == attempt_id).first()

    def save(self, attempt: RecoveryAttemptModel) -> RecoveryAttemptModel:
        if attempt in self.session:
            return attempt
        return self.session.merge(attempt)

    def get_attempts_for_case(self, case_id: str) -> List[RecoveryAttemptModel]:
        return self.session.query(RecoveryAttemptModel).filter(
            RecoveryAttemptModel.case_id == case_id
        ).order_by(RecoveryAttemptModel.created_at.asc()).all()


class PostgresEventRepository(EventRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_provider_event_id(self, provider_event_id: str, provider: Optional[str] = None) -> Optional[PaymentEventModel]:
        query = self.session.query(PaymentEventModel).filter(
            PaymentEventModel.provider_event_id == provider_event_id
        )
        if provider:
            query = query.filter(PaymentEventModel.provider == provider)
        return query.first()

    def save(self, event: PaymentEventModel) -> PaymentEventModel:
        if event in self.session:
            return event
        return self.session.merge(event)


class PostgresAuditRepository(AuditRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def save_event(self, audit_event: AuditEventModel) -> AuditEventModel:
        if audit_event in self.session:
            return audit_event
        return self.session.merge(audit_event)

    def get_timeline_for_case(self, case_id: str) -> List[AuditEventModel]:
        return self.session.query(AuditEventModel).filter(
            (AuditEventModel.case_id == case_id) | (AuditEventModel.aggregate_id == case_id)
        ).order_by(AuditEventModel.timestamp.asc(), AuditEventModel.id.asc()).all()

    def get_events_for_case(self, case_id: str) -> List[AuditEventModel]:
        return self.session.query(AuditEventModel).filter(
            (AuditEventModel.case_id == case_id) | (AuditEventModel.aggregate_id == case_id)
        ).order_by(AuditEventModel.timestamp.asc(), AuditEventModel.id.asc()).all()

    def get_events_for_correlation(self, correlation_id: str) -> List[AuditEventModel]:
        return self.session.query(AuditEventModel).filter(
            AuditEventModel.correlation_id == correlation_id
        ).order_by(AuditEventModel.timestamp.asc(), AuditEventModel.id.asc()).all()

    def get_events_by_type(self, event_type: str) -> List[AuditEventModel]:
        return self.session.query(AuditEventModel).filter(
            AuditEventModel.event_type == event_type
        ).order_by(AuditEventModel.timestamp.asc(), AuditEventModel.id.asc()).all()

    def get_recent_events(self, limit: int = 100) -> List[AuditEventModel]:
        return self.session.query(AuditEventModel).order_by(
            AuditEventModel.timestamp.desc(), AuditEventModel.id.desc()
        ).limit(limit).all()

    def count_events(self, event_type: Optional[str] = None) -> int:
        query = self.session.query(AuditEventModel)
        if event_type:
            query = query.filter(AuditEventModel.event_type == event_type)
        return query.count()


class PostgresRecoveryExecutionRepository(RecoveryExecutionRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, execution_id: str) -> Optional[RecoveryExecutionModel]:
        return self.session.query(RecoveryExecutionModel).filter(
            RecoveryExecutionModel.execution_id == execution_id
        ).first()

    def get_by_idempotency_key(self, idempotency_key: str) -> Optional[RecoveryExecutionModel]:
        return self.session.query(RecoveryExecutionModel).filter(
            RecoveryExecutionModel.idempotency_key == idempotency_key
        ).first()

    def save(self, execution: RecoveryExecutionModel) -> RecoveryExecutionModel:
        if execution in self.session:
            return execution
        return self.session.merge(execution)

    def list_for_case(self, case_id: str) -> List[RecoveryExecutionModel]:
        return self.session.query(RecoveryExecutionModel).filter(
            RecoveryExecutionModel.case_id == case_id
        ).order_by(RecoveryExecutionModel.created_at.asc()).all()


from app.repository.job_repository import JobRepository


class PostgresRecoveryJobRepository(JobRepository):
    """PostgreSQL recovery job repository implementing full Phase 1J durable queue interface."""
    def __init__(self, session: Session) -> None:
        super().__init__(session)


class PostgresProviderRegistryRepository(ProviderRegistryRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_name(self, provider_name: str) -> Optional[ProviderRegistryModel]:
        return self.session.query(ProviderRegistryModel).filter(
            ProviderRegistryModel.provider_name == provider_name
        ).first()

    def list_all(self) -> List[ProviderRegistryModel]:
        return self.session.query(ProviderRegistryModel).order_by(
            ProviderRegistryModel.provider_name.asc()
        ).all()

    def save(self, provider_registry: ProviderRegistryModel) -> ProviderRegistryModel:
        if provider_registry in self.session:
            return provider_registry
        return self.session.merge(provider_registry)


class PostgresProviderOperationRepository(ProviderOperationRepository):
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_id(self, operation_id: str) -> Optional[ProviderOperationModel]:
        return self.session.query(ProviderOperationModel).filter(
            ProviderOperationModel.id == operation_id
        ).first()

    def get_by_execution_id(self, execution_id: str) -> Optional[ProviderOperationModel]:
        return self.session.query(ProviderOperationModel).filter(
            ProviderOperationModel.execution_id == execution_id
        ).order_by(ProviderOperationModel.created_at.desc()).first()

    def get_by_idempotency_key(self, idempotency_key: str) -> Optional[ProviderOperationModel]:
        return self.session.query(ProviderOperationModel).filter(
            ProviderOperationModel.idempotency_key == idempotency_key
        ).first()

    def list_recent(self, limit: int = 100) -> List[ProviderOperationModel]:
        return self.session.query(ProviderOperationModel).order_by(
            ProviderOperationModel.created_at.desc()
        ).limit(limit).all()

    def save(self, operation: ProviderOperationModel) -> ProviderOperationModel:
        if operation in self.session:
            return operation
        return self.session.merge(operation)

