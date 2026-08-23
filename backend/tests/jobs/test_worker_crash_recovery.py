import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.jobs.job import RecoveryJob, JobStatus
from app.jobs.dispatcher import RecoveryJobDispatcher
from app.jobs.worker import RecoveryWorker
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel, RecoveryJobModel

@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = session_factory()
    cust = CustomerModel(id="cust_crash_001")
    pay = PaymentModel(id="pay_crash_001", customer_id="cust_crash_001", amount=1200.0, status="FAILED")
    case = RecoveryCaseModel(id="case_crash_001", payment_id="pay_crash_001", customer_id="cust_crash_001", state="DETECTED")
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_worker_crash_recovery_sweep(db) -> None:
    dispatcher = RecoveryJobDispatcher()
    job = dispatcher.enqueue_job(db, case_id="case_crash_001", payment_id="pay_crash_001", customer_id="cust_crash_001")

    repo = JobRepository(db)
    claimed = repo.claim_job(worker_id="worker_crashed", lease_seconds=1)

    # Force lease expiration in DB
    model = db.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job.job_id).first()
    model.lease_expires_at = datetime.now(timezone.utc) - timedelta(seconds=10)
    db.merge(model)
    db.commit()

    # Worker Beta performs crash recovery
    worker_b = RecoveryWorker(worker_id="worker_beta")
    recovered = worker_b.recover_expired_leases(db)

    assert len(recovered) == 1
    assert recovered[0].job_id == job.job_id
    assert recovered[0].status == JobStatus.RETRY_SCHEDULED
