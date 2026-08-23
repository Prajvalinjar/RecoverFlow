from enum import Enum
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime, timezone


class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    CLAIMED = "CLAIMED"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    COMPLETED = "SUCCEEDED"  # Alias
    FAILED = "FAILED"
    RETRY_SCHEDULED = "RETRY_SCHEDULED"
    DEAD_LETTER = "DEAD_LETTER"
    DEAD_LETTERED = "DEAD_LETTER"  # Alias
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class JobType(str, Enum):
    RECOVERY_CYCLE = "RECOVERY_CYCLE"
    RECONCILIATION = "RECONCILIATION"
    RECOVERY_RETRY = "RECOVERY_RETRY"
    CASE_EVALUATION = "CASE_EVALUATION"


TERMINAL_JOB_STATUSES = {
    JobStatus.SUCCEEDED,
    JobStatus.COMPLETED,
    JobStatus.DEAD_LETTER,
    JobStatus.DEAD_LETTERED,
    JobStatus.CANCELLED,
    JobStatus.EXPIRED,
}


@dataclass
class RecoveryJob:
    """Domain model representing a persistent, durable recovery job."""

    job_id: str
    case_id: str
    payment_id: str
    customer_id: str
    job_type: JobType = JobType.RECOVERY_CYCLE
    status: JobStatus = JobStatus.QUEUED
    priority: str = "MEDIUM"
    attempt_count: int = 1
    max_attempts: int = 3
    available_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    claimed_at: Optional[datetime] = None
    lease_expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    last_error_code: Optional[str] = None
    last_error_category: Optional[str] = None
    correlation_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    worker_id: Optional[str] = None
    worker_claim_token: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self) -> None:
        if not str(self.job_id).strip():
            raise ValueError("job_id cannot be empty.")
        if not str(self.case_id).strip():
            raise ValueError("case_id cannot be empty.")
        if not str(self.payment_id).strip():
            raise ValueError("payment_id cannot be empty.")
        if not str(self.customer_id).strip():
            raise ValueError("customer_id cannot be empty.")
        if self.attempt_count < 0:
            raise ValueError("attempt_count must be >= 0.")
        if self.max_attempts < 1:
            raise ValueError("max_attempts must be >= 1.")
        if not self.idempotency_key:
            self.idempotency_key = f"ik_job_{self.case_id}_{self.attempt_count}"

    @property
    def attempt_number(self) -> int:
        """Backward compatibility alias for attempt_count."""
        return self.attempt_count

    @property
    def trigger_id(self) -> str:
        """Backward compatibility alias for case_id or trigger reference."""
        return self.case_id

    @property
    def is_terminal(self) -> bool:
        return self.status in TERMINAL_JOB_STATUSES

    @property
    def can_retry(self) -> bool:
        return (not self.is_terminal) and (self.attempt_count < self.max_attempts)

    def transition_to(self, new_status: JobStatus) -> None:
        """Validates state transitions preventing illegal status mutations."""
        if self.is_terminal and new_status not in (JobStatus.QUEUED, JobStatus.RETRY_SCHEDULED):
            # Terminal jobs cannot transition to running/claimed
            raise ValueError(f"Cannot transition terminal job in {self.status} to {new_status}")
        self.status = new_status
        self.updated_at = datetime.now(timezone.utc)
