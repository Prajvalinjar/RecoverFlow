import pytest
from app.domain.recovery_job import RecoveryJob, RecoveryJobStatus
from app.recovery.retry_policy import RecoveryRetryPolicy
from app.execution.failures import ExecutionFailure


def test_deterministic_exponential_backoff() -> None:
    policy = RecoveryRetryPolicy(base_delay_seconds=5, max_delay_seconds=300, max_attempts=3)
    
    job1 = RecoveryJob(job_id="job_r1", case_id="case_r1", trigger_id="trig_r1", attempt_number=1, max_attempts=3)
    dec1 = policy.evaluate(job1)
    assert dec1.retryable is True
    assert dec1.next_attempt == 2
    assert dec1.delay_seconds == 5  # 5 * 3^0 = 5

    job2 = RecoveryJob(job_id="job_r2", case_id="case_r2", trigger_id="trig_r2", attempt_number=2, max_attempts=3)
    dec2 = policy.evaluate(job2)
    assert dec2.retryable is True
    assert dec2.next_attempt == 3
    assert dec2.delay_seconds == 15  # 5 * 3^1 = 15


def test_max_attempts_exceeded_stops_retry() -> None:
    policy = RecoveryRetryPolicy(max_attempts=3)
    job = RecoveryJob(job_id="job_r3", case_id="case_r3", trigger_id="trig_r3", attempt_number=3, max_attempts=3)
    dec = policy.evaluate(job)
    assert dec.retryable is False


def test_permanent_failure_category_stops_retry() -> None:
    policy = RecoveryRetryPolicy()
    job = RecoveryJob(job_id="job_r4", case_id="case_r4", trigger_id="trig_r4", attempt_number=1, max_attempts=3)
    failure = ExecutionFailure.permanent("INVALID_CARD", "Card details permanently rejected.")

    dec = policy.evaluate(job, failure)
    assert dec.retryable is False
