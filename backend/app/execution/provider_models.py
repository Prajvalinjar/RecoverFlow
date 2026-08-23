from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Dict, Any


class ProviderStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"
    UNKNOWN = "UNKNOWN"
    REJECTED = "REJECTED"
    TIMEOUT = "TIMEOUT"
    UNSUPPORTED = "UNSUPPORTED"

    @property
    def is_terminal_success(self) -> bool:
        return self == ProviderStatus.SUCCESS

    @property
    def is_terminal_failure(self) -> bool:
        return self in (ProviderStatus.FAILED, ProviderStatus.REJECTED, ProviderStatus.UNSUPPORTED)

    @property
    def requires_reconciliation(self) -> bool:
        return self in (ProviderStatus.PENDING, ProviderStatus.UNKNOWN, ProviderStatus.TIMEOUT)


@dataclass(frozen=True)
class NormalizedProviderResult:
    """Provider-neutral execution result model.

    Guarantees strict separation between provider response structures and domain recovery logic.
    """

    provider: str
    status: ProviderStatus
    provider_reference: Optional[str] = None
    amount: float = 0.0
    currency: str = "INR"
    operation: str = "UNKNOWN"
    error_code: Optional[str] = None
    error_category: Optional[str] = None
    retryable: bool = False
    raw_status: Optional[str] = None
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    correlation_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "status": self.status.value,
            "provider_reference": self.provider_reference,
            "amount": self.amount,
            "currency": self.currency,
            "operation": self.operation,
            "error_code": self.error_code,
            "error_category": self.error_category,
            "retryable": self.retryable,
            "raw_status": self.raw_status,
            "occurred_at": self.occurred_at.isoformat(),
            "correlation_id": self.correlation_id,
        }
