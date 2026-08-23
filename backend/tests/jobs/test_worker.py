import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.jobs.job import RecoveryJob, JobStatus
from app.jobs.dispatcher import RecoveryJobDispatcher
from app.jobs.worker import RecoveryWorker
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel
from app.recovery.operations import RecoveryOperationsController
from app.execution.circuit_breaker import CircuitBreaker, CircuitState

@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = session_factory()
    cust = CustomerModel(id="cust_w_001", segment="VIP", total_spent=1000.0)
    pay = PaymentModel(id="pay_w_001", customer_id="cust_w_001", amount=1500.0, status="FAILED", failure_code="BANK_TIMEOUT")
    case = RecoveryCaseModel(id="case_w_001", payment_id="pay_w_001", customer_id="cust_w_001", state="DETECTED", attempt_count=0)
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_worker_successful_job_execution(db) -> None:
    dispatcher = RecoveryJobDispatcher()
    job = dispatcher.enqueue_job(db, case_id="case_w_001", payment_id="pay_w_001", customer_id="cust_w_001")

    worker = RecoveryWorker(worker_id="worker_test_1")
    worker.start(session=db)
    res = worker.process_next_job(session=db)

    job_repo = JobRepository(db)
    job_updated = job_repo.get_job(job.job_id)
    assert job_updated is not None
    assert job_updated.status == JobStatus.SUCCEEDED


def test_worker_respects_operational_pause(db) -> None:
    ops = RecoveryOperationsController()
    ops.pause(reason="Testing worker pause", actor="OPERATOR", session=db)

    dispatcher = RecoveryJobDispatcher()
    job = dispatcher.enqueue_job(db, case_id="case_w_001", payment_id="pay_w_001", customer_id="cust_w_001")

    worker = RecoveryWorker(worker_id="worker_paused")
    worker.start(session=db)
    res = worker.process_next_job(session=db)

    assert res is None
    job_repo = JobRepository(db)
    job_updated = job_repo.get_job(job.job_id)
    assert job_updated.status == JobStatus.RETRY_SCHEDULED

    # Resume operations
    ops.resume(reason="Resume test", actor="OPERATOR", session=db)
