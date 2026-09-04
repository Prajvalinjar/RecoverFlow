from decimal import Decimal
from enum import Enum
from typing import Optional, Set
from dataclasses import dataclass, field
from datetime import datetime


class InvalidCaseStateTransitionError(ValueError):
    """Raised when an illegal recovery case state transition is attempted."""
    pass


class CaseState(str, Enum):
    DETECTED = "DETECTED"
    ANALYZING = "ANALYZING"
    RECOMMENDATION_READY = "RECOMMENDATION_READY"
    POLICY_REVIEW = "POLICY_REVIEW"
    APPROVED = "APPROVED"
    EXECUTING = "EXECUTING"
    RECOVERED = "RECOVERED"
    FAILED = "FAILED"
    ESCALATED = "ESCALATED"
    STOPPED = "STOPPED"


class CasePriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


TERMINAL_CASE_STATES: Set[CaseState] = {CaseState.RECOVERED, CaseState.ESCALATED, CaseState.STOPPED}

VALID_CASE_TRANSITIONS: dict[CaseState, Set[CaseState]] = {
    CaseState.DETECTED: {CaseState.ANALYZING, CaseState.FAILED, CaseState.STOPPED, CaseState.ESCALATED, CaseState.RECOVERED},
    CaseState.ANALYZING: {CaseState.RECOMMENDATION_READY, CaseState.FAILED, CaseState.STOPPED, CaseState.ESCALATED},
    CaseState.RECOMMENDATION_READY: {CaseState.POLICY_REVIEW, CaseState.FAILED, CaseState.STOPPED, CaseState.ESCALATED},
    CaseState.POLICY_REVIEW: {CaseState.APPROVED, CaseState.STOPPED, CaseState.FAILED, CaseState.ESCALATED},
    CaseState.APPROVED: {CaseState.EXECUTING, CaseState.STOPPED, CaseState.FAILED},
    CaseState.EXECUTING: {CaseState.RECOVERED, CaseState.FAILED, CaseState.ESCALATED, CaseState.STOPPED, CaseState.DETECTED},
    CaseState.RECOVERED: set(),
    CaseState.FAILED: {CaseState.DETECTED, CaseState.ANALYZING, CaseState.STOPPED, CaseState.ESCALATED},  # Allows retries if under limit
    CaseState.ESCALATED: set(),
    CaseState.STOPPED: set(),
}


@dataclass
class RecoveryCase:
    case_id: str
    payment_id: str
    customer_id: str
    amount_at_risk: Decimal = Decimal("100.00")
    state: CaseState = CaseState.DETECTED
    priority: CasePriority = CasePriority.MEDIUM
    detected_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    risk_reason: str = "Payment Failure Detected"
    attempts_count: int = 0
    max_allowed_attempts: int = 3
    last_attempt_at: Optional[datetime] = None
    correlation_id: Optional[str] = None

    def __post_init__(self) -> None:
        if self.amount_at_risk <= Decimal("0"):
            raise ValueError("amount_at_risk must be greater than zero.")
        if self.attempts_count < 0:
            raise ValueError("attempts_count cannot be negative.")
        if self.max_allowed_attempts < 1:
            raise ValueError("max_allowed_attempts must be at least 1.")

    def is_terminal(self) -> bool:
        return self.state in TERMINAL_CASE_STATES

    def transition_to(self, new_state: CaseState) -> None:
        if new_state == self.state:
            return
        if self.is_terminal():
            raise InvalidCaseStateTransitionError(
                f"Cannot transition case '{self.case_id}' from terminal state {self.state.value} to {new_state.value}."
            )
        self.state = new_state
        self.updated_at = datetime.now()
