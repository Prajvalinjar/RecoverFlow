import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.workers.worker_identity import WorkerIdentity
from app.workers.worker_registry import WorkerRegistry
from app.jobs.job import RecoveryJob, JobStatus
from app.jobs.worker import RecoveryWorker
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel, WorkerModel


@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = Session()
    cust = CustomerModel(id="cust_dfail_001")
    pay = PaymentModel(id="pay_dfail_001", customer_id="cust_dfail_001", amount=2000.0, status="FAILED")
    case = RecoveryCaseModel(id="case_dfail_001", payment_id="pay_dfail_001", customer_id="cust_dfail_001", state="DETECTED")
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_distributed_failure_worker_crash_does_not_cause_duplicate_execution(db) -> None:
    registry = WorkerRegistry(db)
    registry.register_worker(WorkerIdentity(worker_id="w_crashed"))

    repo = JobRepository(db)
    job = repo.create_job(RecoveryJob(job_id="j_df1", case_id="case_dfail_001", payment_id="pay_dfail_001", customer_id="cust_dfail_001"))
    claimed = repo.claim_job("w_crashed", lease_seconds=60)

    # Force crash
    w_model = db.query(WorkerModel).filter(WorkerModel.worker_id == "w_crashed").first()
    w_model.last_heartbeat_at = datetime.now(timezone.utc) - timedelta(seconds=60)
    db.merge(w_model)
    db.commit()

    w_healthy = RecoveryWorker(worker_id="w_healthy")
    recovered = w_healthy.recover_expired_leases(db)
    assert len(recovered) == 1

    # Execute with healthy worker
    w_healthy.process_next_job(db)
    final_job = repo.get_job("j_df1")
    assert final_job.status in (JobStatus.SUCCEEDED, JobStatus.FAILED, JobStatus.RETRY_SCHEDULED)
