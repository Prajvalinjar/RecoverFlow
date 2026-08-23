import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.jobs.job import RecoveryJob, JobStatus, JobType
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel

@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = session_factory()
    # Seed required foreign keys
    cust = CustomerModel(id="cust_repo_001")
    pay = PaymentModel(id="pay_repo_001", customer_id="cust_repo_001", amount=1000, status="FAILED")
    case = RecoveryCaseModel(id="case_repo_001", payment_id="pay_repo_001", customer_id="cust_repo_001")
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_job_repository_crud_and_claim(db) -> None:
    repo = JobRepository(db)
    job = RecoveryJob(
        job_id="job_repo_001",
        case_id="case_repo_001",
        payment_id="pay_repo_001",
        customer_id="cust_repo_001",
        priority="HIGH",
    )
    saved = repo.create_job(job)
    assert saved.job_id == "job_repo_001"

    # Fetch
    fetched = repo.get_job("job_repo_001")
    assert fetched is not None
    assert fetched.status == JobStatus.QUEUED

    # Atomic claim
    claimed = repo.claim_job(worker_id="worker_test_1", lease_seconds=60)
    assert claimed is not None
    assert claimed.job_id == "job_repo_001"
    assert claimed.status == JobStatus.CLAIMED
    assert claimed.claimed_at is not None
    assert claimed.lease_expires_at is not None

    # Complete
    completed = repo.complete_job("job_repo_001", correlation_id="corr_completed")
    assert completed is not None
    assert completed.status == JobStatus.SUCCEEDED


def test_job_repository_expired_lease_recovery(db) -> None:
    repo = JobRepository(db)
    job = RecoveryJob(
        job_id="job_repo_exp_001",
        case_id="case_repo_001",
        payment_id="pay_repo_001",
        customer_id="cust_repo_001",
    )
    repo.create_job(job)
    claimed = repo.claim_job(worker_id="worker_crashed", lease_seconds=1)

    # Force lease expiration
    from app.repository.models import RecoveryJobModel
    model = db.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == "job_repo_exp_001").first()
    model.lease_expires_at = datetime.now(timezone.utc) - timedelta(seconds=10)
    db.merge(model)
    db.commit()

    # Recover
    recovered = repo.recover_expired_jobs()
    assert len(recovered) == 1
    assert recovered[0].job_id == "job_repo_exp_001"
    assert recovered[0].status == JobStatus.RETRY_SCHEDULED
