import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.jobs.job import RecoveryJob, JobStatus
from app.jobs.reconciliation import JobQueueReconciliationService
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel


@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = Session()
    cust = CustomerModel(id="cust_recon_001")
    pay = PaymentModel(id="pay_recon_001", customer_id="cust_recon_001", amount=1000.0, status="FAILED")
    case = RecoveryCaseModel(id="case_recon_001", payment_id="pay_recon_001", customer_id="cust_recon_001", state="RECOVERED")
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_queue_reconciliation_cancels_terminal_case_jobs(db) -> None:
    repo = JobRepository(db)
    job = RecoveryJob(
        job_id="job_recon_001",
        case_id="case_recon_001",
        payment_id="pay_recon_001",
        customer_id="cust_recon_001",
        status=JobStatus.QUEUED,
    )
    repo.create_job(job)

    service = JobQueueReconciliationService(db)
    report = service.reconcile_queue()

    assert report.repaired >= 1
    updated = repo.get_job("job_recon_001")
    assert updated.status == JobStatus.CANCELLED
