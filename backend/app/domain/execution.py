from enum import Enum
from typing import Optional, Set
from dataclasses import dataclass, field
from datetime import datetime
from app.domain.actions import CandidateRecoveryAction


class InvalidExecutionStateTransitionError(ValueError):
    """Raised when an illegal execution status transition is attempted."""
    pass


class ExecutionStatus(str, Enum):
    PENDING = "PENDING"
    DISPATCHED = "DISPATCHED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REJECTED = "REJECTED"
    UNKNOWN = "UNKNOWN"


# Allowed execution state transitions
VALID_EXECUTION_TRANSITIONS: dict[ExecutionStatus, Set[ExecutionStatus]] = {
    ExecutionStatus.PENDING: {ExecutionStatus.DISPATCHED, ExecutionStatus.FAILED, ExecutionStatus.REJECTED},
    ExecutionStatus.DISPATCHED: {ExecutionStatus.PROCESSING, ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.REJECTED, ExecutionStatus.UNKNOWN},
    ExecutionStatus.PROCESSING: {ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.REJECTED, ExecutionStatus.UNKNOWN},
    ExecutionStatus.UNKNOWN: {ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.REJECTED},
    ExecutionStatus.COMPLETED: set(),  # Terminal
    ExecutionStatus.FAILED: set(),     # Terminal
    ExecutionStatus.REJECTED: set(),   # Terminal
}


@dataclass
class RecoveryExecution:
    """Execution contract representing an authorized recovery action."""
    execution_id: str
    case_id: str
    policy_decision_id: str
    action: CandidateRecoveryAction
    status: ExecutionStatus
    idempotency_key: str
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    provider_reference: Optional[str] = None
    error_message: Optional[str] = None
    correlation_id: Optional[str] = None

    def __post_init__(self) -> None:
        if not self.idempotency_key.strip():
            raise ValueError("idempotency_key cannot be empty.")
        if not self.execution_id.strip():
            raise ValueError("execution_id cannot be empty.")
        if not self.case_id.strip():
            raise ValueError("case_id cannot be empty.")
        if not self.policy_decision_id.strip():
            raise ValueError("policy_decision_id cannot be empty.")

    @property
    def is_terminal(self) -> bool:
        return self.status in (ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.REJECTED)

    def transition_to(self, new_status: ExecutionStatus) -> None:
        """Transitions execution status enforcing valid state machine rules."""
        if new_status == self.status:
            return
        allowed_targets = VALID_EXECUTION_TRANSITIONS.get(self.status, set())
        if new_status not in allowed_targets:
            raise InvalidExecutionStateTransitionError(
                f"Cannot transition execution '{self.execution_id}' from {self.status.value} to {new_status.value}."
            )
        self.status = new_status
        if self.is_terminal and not self.completed_at:
            self.completed_at = datetime.now()
