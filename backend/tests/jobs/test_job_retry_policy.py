from datetime import datetime, timezone
from app.jobs.job import RecoveryJob, JobStatus
from app.jobs.retry import RetryPolicy


def test_retry_policy_exponential_backoff() -> None:
    policy = RetryPolicy(base_delay_seconds=5, max_delay_seconds=300, jitter_enabled=False)
    assert policy.calculate_delay(attempt=1) == 5
    assert policy.calculate_delay(attempt=2) == 10
    assert policy.calculate_delay(attempt=3) == 20
    assert policy.calculate_delay(attempt=4) == 40
    assert policy.calculate_delay(attempt=10) == 300


def test_retry_policy_should_retry_evaluations() -> None:
    policy = RetryPolicy(max_attempts=3, base_delay_seconds=5)
    job = RecoveryJob(
        job_id="job_r1",
        case_id="c1",
        payment_id="p1",
        customer_id="cust1",
        attempt_count=1,
        max_attempts=3,
    )

    # Transient error attempt 1 -> True
    should_retry, next_time = policy.should_retry(job, error_code="NETWORK_TIMEOUT")
    assert should_retry is True
    assert next_time is not None

    # Max attempts reached -> False
    job_max = RecoveryJob(
        job_id="job_r2",
        case_id="c1",
        payment_id="p1",
        customer_id="cust1",
        attempt_count=3,
        max_attempts=3,
    )
    should_retry2, _ = policy.should_retry(job_max, error_code="NETWORK_TIMEOUT")
    assert should_retry2 is False

    # Permanent error -> False
    should_retry3, _ = policy.should_retry(job, error_code="TERMINAL_CASE", error_category="PERMANENT")
    assert should_retry3 is False
