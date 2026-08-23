import pytest
from datetime import datetime, timezone
from app.jobs.job import RecoveryJob, JobStatus, JobType


def test_job_model_creation_and_defaults() -> None:
    job = RecoveryJob(
        job_id="job_test_001",
        case_id="case_test_001",
        payment_id="pay_test_001",
        customer_id="cust_test_001",
        job_type=JobType.RECOVERY_CYCLE,
    )
    assert job.job_id == "job_test_001"
    assert job.status == JobStatus.QUEUED
    assert job.attempt_count == 1
    assert job.max_attempts == 3
    assert job.is_terminal is False
    assert job.can_retry is True
    assert job.idempotency_key == "ik_job_case_test_001_1"


def test_job_model_validation() -> None:
    with pytest.raises(ValueError, match="job_id cannot be empty"):
        RecoveryJob(job_id="", case_id="c", payment_id="p", customer_id="c")

    with pytest.raises(ValueError, match="attempt_count must be >= 0"):
        RecoveryJob(job_id="j", case_id="c", payment_id="p", customer_id="c", attempt_count=-1)


def test_job_state_transitions() -> None:
    job = RecoveryJob(
        job_id="job_test_002",
        case_id="case_test_002",
        payment_id="pay_test_002",
        customer_id="cust_test_002",
        status=JobStatus.SUCCEEDED,
    )
    assert job.is_terminal is True

    with pytest.raises(ValueError, match="Cannot transition terminal job"):
        job.transition_to(JobStatus.RUNNING)
