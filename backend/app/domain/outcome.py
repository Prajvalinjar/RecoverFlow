from decimal import Decimal
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime


class OutcomeStatus(str, Enum):
    RECOVERED = "RECOVERED"
    NOT_RECOVERED = "NOT_RECOVERED"
    PARTIALLY_RECOVERED = "PARTIALLY_RECOVERED"
    FAILED = "FAILED"
    PENDING = "PENDING"


@dataclass(frozen=True)
class RecoveryOutcome:
    """Outcome verification contract recording the result of an executed recovery action."""
    outcome_id: str
    case_id: str
    execution_id: str
    status: OutcomeStatus
    recovered_amount: Decimal = Decimal("0.00")
    failure_reason: Optional[str] = None
    verified_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        if self.recovered_amount < Decimal("0"):
            raise ValueError("recovered_amount cannot be negative.")
