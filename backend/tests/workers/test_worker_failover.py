import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.workers.worker_identity import WorkerIdentity, WorkerStatus
from app.workers.worker_registry import WorkerRegistry
from app.jobs.worker import RecoveryWorker
from app.jobs.job import RecoveryJob, JobStatus
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel, WorkerModel, RecoveryJobModel


@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = Session()
    cust = CustomerModel(id="cust_fail_001")
    pay = PaymentModel(id="pay_fail_001", customer_id="cust_fail_001", amount=1000.0, status="FAILED")
    case = RecoveryCaseModel(id="case_fail_001", payment_id="pay_fail_001", customer_id="cust_fail_001", state="DETECTED")
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_worker_failover_recovery_of_lost_worker_jobs(db) -> None:
    registry = WorkerRegistry(db)
    w_alpha = registry.register_worker(WorkerIdentity(worker_id="worker_alpha"))

    repo = JobRepository(db)
    job = repo.create_job(RecoveryJob(job_id="job_fail_001", case_id="case_fail_001", payment_id="pay_fail_001", customer_id="cust_fail_001"))
    claimed = repo.claim_job(worker_id="worker_alpha", lease_seconds=60)

    # Force Worker Alpha into lost status
    w_model = db.query(WorkerModel).filter(WorkerModel.worker_id == "worker_alpha").first()
    w_model.last_heartbeat_at = datetime.now(timezone.utc) - timedelta(seconds=60)
    db.merge(w_model)
    db.commit()

    # Worker Beta performs failover recovery
    worker_beta = RecoveryWorker(worker_id="worker_beta")
    recovered = worker_beta.recover_expired_leases(db)

    assert len(recovered) == 1
    assert recovered[0].job_id == "job_fail_001"
    assert recovered[0].status == JobStatus.RETRY_SCHEDULED
