import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.workers.worker_identity import WorkerIdentity
from app.workers.worker_registry import WorkerRegistry
from app.jobs.job import RecoveryJob, JobStatus
from app.jobs.worker import RecoveryWorker
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel


@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = Session()
    cust = CustomerModel(id="cust_p1k_001", segment="VIP")
    pay = PaymentModel(id="pay_p1k_001", customer_id="cust_p1k_001", amount=3000.0, status="FAILED", failure_code="BANK_TIMEOUT")
    case = RecoveryCaseModel(id="case_p1k_001", payment_id="pay_p1k_001", customer_id="cust_p1k_001", state="DETECTED")
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_phase_1k_end_to_end_distributed_flow(db) -> None:
    # 1. Start Workers
    w1 = RecoveryWorker(worker_id="w_int_1")
    w2 = RecoveryWorker(worker_id="w_int_2")
    w1.start(session=db)
    w2.start(session=db)

    # 2. Enqueue Job
    repo = JobRepository(db)
    job = repo.create_job(RecoveryJob(job_id="job_p1k_001", case_id="case_p1k_001", payment_id="pay_p1k_001", customer_id="cust_p1k_001"))

    # 3. Worker 1 claims & processes
    res1 = w1.process_next_job(db)
    final_job = repo.get_job("job_p1k_001")
    assert final_job.status == JobStatus.SUCCEEDED
    assert final_job.worker_id == "w_int_1"

    # 4. Worker 2 attempts same -> Returns None
    res2 = w2.process_next_job(db)
    assert res2 is None
