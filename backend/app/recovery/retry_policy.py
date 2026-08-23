from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

from app.domain.recovery_job import RecoveryJob
from app.execution.failures import ExecutionFailure, ExecutionFailureCategory


@dataclass(frozen=True)
class RetryDecision:
    """Decision container indicating whether a job attempt should be retried."""
    retryable: bool
    next_attempt: int
    delay_seconds: int
    reason: str


class RecoveryRetryPolicy:
    """Deterministic exponential backoff retry policy for recovery job dispatching."""

    def __init__(self, base_delay_seconds: int = 5, max_delay_seconds: int = 300, max_attempts: int = 3) -> None:
        self.base_delay_seconds = base_delay_seconds
        self.max_delay_seconds = max_delay_seconds
        self.max_attempts = max_attempts

    def evaluate(self, job: RecoveryJob, failure: Optional[ExecutionFailure] = None) -> RetryDecision:
        # Check non-retryable failure categories
        if failure:
            if not failure.retryable or failure.category in (
                ExecutionFailureCategory.PERMANENT_PROVIDER_FAILURE,
                ExecutionFailureCategory.VALIDATION_FAILURE,
                ExecutionFailureCategory.AUTHORIZATION_FAILURE,
            ):
                return RetryDecision(
                    retryable=False,
                    next_attempt=job.attempt_number,
                    delay_seconds=0,
                    reason=f"Failure category '{failure.category.value}' is non-retryable ({failure.message}).",
                )

        if job.attempt_number >= self.max_attempts or job.attempt_number >= job.max_attempts:
            return RetryDecision(
                retryable=False,
                next_attempt=job.attempt_number,
                delay_seconds=0,
                reason=f"Maximum retry attempts reached ({job.attempt_number}/{job.max_attempts}).",
            )

        next_attempt = job.attempt_number + 1
        # Deterministic exponential backoff calculation: base_delay * 3^(attempt - 1)
        delay = min(self.base_delay_seconds * (3 ** (job.attempt_number - 1)), self.max_delay_seconds)

        return RetryDecision(
            retryable=True,
            next_attempt=next_attempt,
            delay_seconds=delay,
            reason=f"Transient failure retry approved for attempt {next_attempt} in {delay}s.",
        )
