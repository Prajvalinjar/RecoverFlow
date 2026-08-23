from decimal import Decimal
from enum import Enum
from dataclasses import dataclass
from app.intelligence.failure_classifier import FailureCategory, FailureSeverity


class UrgencyLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    IMMEDIATE = "IMMEDIATE"


@dataclass(frozen=True)
class RecoverySignals:
    """Structured evidence signals extracted from payment, customer context, and recovery case history."""
    failure_category: FailureCategory
    failure_severity: FailureSeverity
    retry_attempt_count: int
    max_allowed_retries: int
    customer_historical_success_rate: float
    customer_success_count: int
    customer_failure_count: int
    previous_recovery_success_rate: float
    average_payment_delay_hours: float
    payment_amount: Decimal
    time_since_failure_minutes: float
    cooldown_satisfied: bool
    customer_reliability_segment: str
    urgency: UrgencyLevel

    @property
    def retries_exhausted(self) -> bool:
        return self.retry_attempt_count >= self.max_allowed_retries
