import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.jobs.job import RecoveryJob, JobStatus
from app.jobs.dispatcher import RecoveryJobDispatcher
from app.jobs.worker import RecoveryWorker
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel

@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = session_factory()
    cust = CustomerModel(id="cust_conc_001")
    pay = PaymentModel(id="pay_conc_001", customer_id="cust_conc_001", amount=2000.0, status="FAILED")
    case = RecoveryCaseModel(id="case_conc_001", payment_id="pay_conc_001", customer_id="cust_conc_001", state="DETECTED")
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_concurrent_worker_claiming_prevents_double_claim(db) -> None:
    dispatcher = RecoveryJobDispatcher()
    job = dispatcher.enqueue_job(db, case_id="case_conc_001", payment_id="pay_conc_001", customer_id="cust_conc_001")

    repo1 = JobRepository(db)
    repo2 = JobRepository(db)

    # Worker 1 claims job
    claimed1 = repo1.claim_job(worker_id="worker_alpha", lease_seconds=60)
    assert claimed1 is not None
    assert claimed1.job_id == job.job_id

    # Worker 2 attempts to claim job immediately
    claimed2 = repo2.claim_job(worker_id="worker_beta", lease_seconds=60)
    assert claimed2 is None
