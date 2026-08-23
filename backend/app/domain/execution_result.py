from enum import Enum
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime


class ProviderExecutionStatus(str, Enum):
    ACCEPTED = "ACCEPTED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REJECTED = "REJECTED"
    UNKNOWN = "UNKNOWN"


@dataclass(frozen=True)
class ExecutionResult:
    """Provider-agnostic result container capturing the output of a payment recovery action."""
    execution_id: str
    idempotency_key: str
    status: ProviderExecutionStatus
    provider: str
    provider_reference: Optional[str] = None
    amount_processed: Optional[float] = None
    currency: str = "INR"
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    executed_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.execution_id.strip():
            raise ValueError("execution_id cannot be empty.")
        if not self.idempotency_key.strip():
            raise ValueError("idempotency_key cannot be empty.")
        if not self.provider.strip():
            raise ValueError("provider cannot be empty.")
        if self.amount_processed is not None and self.amount_processed <= 0:
            raise ValueError("amount_processed must be greater than zero when provided.")

    @property
    def is_successful(self) -> bool:
        return self.status == ProviderExecutionStatus.COMPLETED

    @property
    def is_terminal(self) -> bool:
        return self.status in (
            ProviderExecutionStatus.COMPLETED,
            ProviderExecutionStatus.FAILED,
            ProviderExecutionStatus.REJECTED,
        )
