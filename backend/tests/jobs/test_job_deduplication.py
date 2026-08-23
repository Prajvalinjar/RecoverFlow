import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.jobs.job import RecoveryJob
from app.jobs.deduplication import JobDeduplicationService
from app.repository.job_repository import JobRepository
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel


@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = Session()
    cust = CustomerModel(id="cust_dedup_001")
    pay = PaymentModel(id="pay_dedup_001", customer_id="cust_dedup_001", amount=1500.0, status="FAILED")
    case = RecoveryCaseModel(id="case_dedup_001", payment_id="pay_dedup_001", customer_id="cust_dedup_001", state="DETECTED")
    session.add_all([cust, pay, case])
    session.commit()
    try:
        yield session
    finally:
        session.close()


def test_job_deduplication_service(db) -> None:
    repo = JobRepository(db)
    job = RecoveryJob(
        job_id="job_dedup_001",
        case_id="case_dedup_001",
        payment_id="pay_dedup_001",
        customer_id="cust_dedup_001",
        idempotency_key="ik_dedup_test",
    )
    repo.create_job(job)

    dedup = JobDeduplicationService(repo)
    is_dup, existing = dedup.check_or_register(
        session=db,
        idempotency_key="ik_dedup_test",
        case_id="case_dedup_001",
        payment_id="pay_dedup_001",
    )
    assert is_dup is True
    assert existing is not None
    assert existing.job_id == "job_dedup_001"
