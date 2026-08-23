from enum import Enum
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime


class RecoveryJobStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    RETRY_SCHEDULED = "RETRY_SCHEDULED"
    DEAD_LETTERED = "DEAD_LETTERED"
    CANCELLED = "CANCELLED"


@dataclass
class RecoveryJob:
    """Domain model representing a persistent, durable recovery job."""
    job_id: str
    case_id: str
    trigger_id: str
    status: RecoveryJobStatus = RecoveryJobStatus.QUEUED
    attempt_number: int = 1
    max_attempts: int = 3
    available_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    correlation_id: Optional[str] = None

    def __post_init__(self) -> None:
        if not self.job_id.strip():
            raise ValueError("job_id cannot be empty.")
        if not self.case_id.strip():
            raise ValueError("case_id cannot be empty.")
        if not self.trigger_id.strip():
            raise ValueError("trigger_id cannot be empty.")
        if self.attempt_number < 1:
            raise ValueError("attempt_number must be >= 1.")
        if self.max_attempts < 1:
            raise ValueError("max_attempts must be >= 1.")

    @property
    def is_terminal(self) -> bool:
        return self.status in (
            RecoveryJobStatus.COMPLETED,
            RecoveryJobStatus.DEAD_LETTERED,
            RecoveryJobStatus.CANCELLED,
        )

    @property
    def can_retry(self) -> bool:
        return (not self.is_terminal) and (self.attempt_number < self.max_attempts)
