from typing import Tuple, Optional
from datetime import datetime, timezone, timedelta
from app.jobs.job import RecoveryJob, JobStatus


class RetryPolicy:
    """Deterministic exponential backoff retry engine for durable recovery jobs."""

    def __init__(
        self,
        max_attempts: int = 3,
        base_delay_seconds: int = 5,
        max_delay_seconds: int = 300,
        jitter_enabled: bool = False,
    ) -> None:
        self.max_attempts = max_attempts
        self.base_delay_seconds = base_delay_seconds
        self.max_delay_seconds = max_delay_seconds
        self.jitter_enabled = jitter_enabled

    def calculate_delay(self, attempt: int) -> int:
        """Calculates exponential backoff delay in seconds."""
        # 0-indexed attempt power calculation
        attempt_pow = max(0, attempt - 1)
        delay = self.base_delay_seconds * (2 ** attempt_pow)
        return min(delay, self.max_delay_seconds)

    def calculate_next_available_at(self, attempt: int, current_time: Optional[datetime] = None) -> datetime:
        now = current_time or datetime.now(timezone.utc)
        delay = self.calculate_delay(attempt)
        return now + timedelta(seconds=delay)

    def is_transient_error(self, error_code: Optional[str] = None, error_category: Optional[str] = None) -> bool:
        """Determines if an error is transient (retriable) vs permanent (non-retriable)."""
        if error_category:
            if error_category.upper() == "PERMANENT":
                return False
            if error_category.upper() == "TRANSIENT":
                return True

        permanent_codes = {
            "TERMINAL_CASE",
            "POLICY_REJECTED",
            "INVALID_REQUEST",
            "UNAUTHORIZED",
            "SECURITY_VIOLATION",
            "MAX_ATTEMPTS_EXHAUSTED",
        }
        if error_code and error_code.upper() in permanent_codes:
            return False

        return True

    def should_retry(
        self,
        job: RecoveryJob,
        error_code: Optional[str] = None,
        error_category: Optional[str] = None,
    ) -> Tuple[bool, Optional[datetime]]:
        """Evaluates whether a job should be scheduled for retry and calculates next available time."""
        if job.is_terminal:
            return False, None

        if job.attempt_count >= job.max_attempts:
            return False, None

        if not self.is_transient_error(error_code, error_category):
            return False, None

        next_time = self.calculate_next_available_at(job.attempt_count)
        return True, next_time
