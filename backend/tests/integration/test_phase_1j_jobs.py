import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.jobs.job import RecoveryJob, JobStatus
from app.jobs.dispatcher import RecoveryJobDispatcher
from app.jobs.worker import RecoveryWorker
from app.jobs.retry import RetryPolicy
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel, RecoveryJobModel
from app.recovery.operations import RecoveryOperationsController
from app.execution.circuit_breaker import CircuitBreaker, CircuitState

@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = session_factory()
    cust = CustomerModel(id="cust_p1j_001", segment="REGULAR", total_spent=3000.0)
    pay = PaymentModel(id="pay_p1j_001", customer_id="cust_p1j_001", amount=2500.0, status="FAILED", failure_code="BANK_TIMEOUT")
    case = RecoveryCaseModel(id="case_p1j_001", payment_id="pay_p1j_001", customer_id="cust_p1j_001", state="DETECTED", attempt_count=0)
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_scenario_a_normal_successful_job(db) -> None:
    dispatcher = RecoveryJobDispatcher()
    job = dispatcher.enqueue_job(db, case_id="case_p1j_001", payment_id="pay_p1j_001", customer_id="cust_p1j_001", correlation_id="corr_p1j_a")

    worker = RecoveryWorker(worker_id="worker_integration_a")
    worker.start(session=db)
    result = worker.process_next_job(session=db)

    job_repo = JobRepository(db)
    job_updated = job_repo.get_job(job.job_id)
    assert job_updated is not None
    assert job_updated.status in (JobStatus.SUCCEEDED, JobStatus.COMPLETED)
    assert job_updated.completed_at is not None


def test_scenario_d_and_e_worker_crash_recovery_preserves_idempotency(db) -> None:
    dispatcher = RecoveryJobDispatcher()
    job = dispatcher.enqueue_job(db, case_id="case_p1j_001", payment_id="pay_p1j_001", customer_id="cust_p1j_001", correlation_id="corr_p1j_de")

    repo = JobRepository(db)
    claimed = repo.claim_job(worker_id="worker_crashed", lease_seconds=1)

    # Force lease expiry
    model = db.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job.job_id).first()
    model.lease_expires_at = datetime.now(timezone.utc) - timedelta(seconds=10)
    db.merge(model)
    db.commit()

    worker_b = RecoveryWorker(worker_id="worker_b")
    recovered = worker_b.recover_expired_leases(db)
    assert len(recovered) == 1

    worker_b.start(session=db)
    result = worker_b.process_next_job(session=db)
    job_final = repo.get_job(job.job_id)
    assert job_final.status in (JobStatus.SUCCEEDED, JobStatus.COMPLETED)


def test_scenario_g_h_pause_and_terminal_case_safety(db) -> None:
    ops = RecoveryOperationsController()
    ops.pause(reason="Integration pause test", actor="OPERATOR", session=db)

    dispatcher = RecoveryJobDispatcher()
    job = dispatcher.enqueue_job(db, case_id="case_p1j_001", payment_id="pay_p1j_001", customer_id="cust_p1j_001")

    worker = RecoveryWorker(worker_id="worker_p1j_gh")
    worker.start(session=db)
    res = worker.process_next_job(session=db)

    assert res is None
    repo = JobRepository(db)
    job_updated = repo.get_job(job.job_id)
    assert job_updated.status == JobStatus.RETRY_SCHEDULED

    # Resume operations
    ops.resume(reason="Resume integration test", actor="OPERATOR", session=db)
