from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from app.repository.models import (
    CustomerModel,
    PaymentModel,
    RecoveryCaseModel,
    RecoveryAttemptModel,
    PaymentEventModel,
    AuditEventModel,
    RecoveryExecutionModel,
    RecoveryJobModel,
)


class CustomerRepository(ABC):
    @abstractmethod
    def get_by_id(self, customer_id: str) -> Optional[CustomerModel]:
        pass

    @abstractmethod
    def save(self, customer: CustomerModel) -> CustomerModel:
        pass


class PaymentRepository(ABC):
    @abstractmethod
    def get_by_id(self, payment_id: str) -> Optional[PaymentModel]:
        pass

    @abstractmethod
    def save(self, payment: PaymentModel) -> PaymentModel:
        pass

    @abstractmethod
    def get_by_customer_id(self, customer_id: str) -> List[PaymentModel]:
        pass


class RecoveryCaseRepository(ABC):
    @abstractmethod
    def get_by_id(self, case_id: str) -> Optional[RecoveryCaseModel]:
        pass

    @abstractmethod
    def get_by_payment_id(self, payment_id: str) -> Optional[RecoveryCaseModel]:
        pass

    @abstractmethod
    def save(self, case: RecoveryCaseModel) -> RecoveryCaseModel:
        pass

    @abstractmethod
    def list_active_cases(self) -> List[RecoveryCaseModel]:
        pass


class RecoveryAttemptRepository(ABC):
    @abstractmethod
    def get_by_id(self, attempt_id: str) -> Optional[RecoveryAttemptModel]:
        pass

    @abstractmethod
    def save(self, attempt: RecoveryAttemptModel) -> RecoveryAttemptModel:
        pass

    @abstractmethod
    def get_attempts_for_case(self, case_id: str) -> List[RecoveryAttemptModel]:
        pass


class EventRepository(ABC):
    @abstractmethod
    def get_by_provider_event_id(
        self, provider_event_id: str, provider: Optional[str] = None
    ) -> Optional[PaymentEventModel]:
        pass

    @abstractmethod
    def save(self, event: PaymentEventModel) -> PaymentEventModel:
        pass


class ProviderRegistryRepository(ABC):
    @abstractmethod
    def get_by_name(self, provider_name: str) -> Optional[Any]:
        pass

    @abstractmethod
    def list_all(self) -> List[Any]:
        pass

    @abstractmethod
    def save(self, provider_registry: Any) -> Any:
        pass


class ProviderOperationRepository(ABC):
    @abstractmethod
    def get_by_id(self, operation_id: str) -> Optional[Any]:
        pass

    @abstractmethod
    def get_by_execution_id(self, execution_id: str) -> Optional[Any]:
        pass

    @abstractmethod
    def get_by_idempotency_key(self, idempotency_key: str) -> Optional[Any]:
        pass

    @abstractmethod
    def list_recent(self, limit: int = 100) -> List[Any]:
        pass

    @abstractmethod
    def save(self, operation: Any) -> Any:
        pass



class AuditRepository(ABC):
    @abstractmethod
    def save_event(self, audit_event: AuditEventModel) -> AuditEventModel:
        pass

    @abstractmethod
    def get_timeline_for_case(self, case_id: str) -> List[AuditEventModel]:
        pass

    @abstractmethod
    def get_events_for_case(self, case_id: str) -> List[AuditEventModel]:
        pass

    @abstractmethod
    def get_events_for_correlation(self, correlation_id: str) -> List[AuditEventModel]:
        pass

    @abstractmethod
    def get_events_by_type(self, event_type: str) -> List[AuditEventModel]:
        pass

    @abstractmethod
    def get_recent_events(self, limit: int = 100) -> List[AuditEventModel]:
        pass

    @abstractmethod
    def count_events(self, event_type: Optional[str] = None) -> int:
        pass


class RecoveryExecutionRepository(ABC):
    @abstractmethod
    def get_by_id(self, execution_id: str) -> Optional[RecoveryExecutionModel]:
        pass

    @abstractmethod
    def get_by_idempotency_key(self, idempotency_key: str) -> Optional[RecoveryExecutionModel]:
        pass

    @abstractmethod
    def save(self, execution: RecoveryExecutionModel) -> RecoveryExecutionModel:
        pass

    @abstractmethod
    def list_for_case(self, case_id: str) -> List[RecoveryExecutionModel]:
        pass


class RecoveryJobRepository(ABC):
    @abstractmethod
    def get_by_id(self, job_id: str) -> Optional[RecoveryJobModel]:
        pass

    @abstractmethod
    def save(self, job: RecoveryJobModel) -> RecoveryJobModel:
        pass

    @abstractmethod
    def list_for_case(self, case_id: str) -> List[RecoveryJobModel]:
        pass

    @abstractmethod
    def claim_next_job(self) -> Optional[RecoveryJobModel]:
        pass
