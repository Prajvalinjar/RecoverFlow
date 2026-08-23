import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.recovery.trigger import RecoveryTrigger
from app.recovery.dispatcher import RecoveryJobDispatcher
from app.repository.postgres import (
    PostgresCustomerRepository,
    PostgresPaymentRepository,
    PostgresRecoveryCaseRepository,
    PostgresRecoveryJobRepository,
)
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_job_dispatcher_persists_job_record(db_session) -> None:
    cust_repo = PostgresCustomerRepository(db_session)
    pay_repo = PostgresPaymentRepository(db_session)
    case_repo = PostgresRecoveryCaseRepository(db_session)
    job_repo = PostgresRecoveryJobRepository(db_session)

    cust_repo.save(CustomerModel(id="cust_disp_1", segment="REGULAR"))
    pay_repo.save(PaymentModel(id="pay_disp_1", customer_id="cust_disp_1", amount=1500.0, status="FAILED", failure_code="BANK_TIMEOUT"))
    case_repo.save(RecoveryCaseModel(id="case_pay_disp_1", payment_id="pay_disp_1", customer_id="cust_disp_1", state="DETECTED"))
    db_session.commit()

    trigger = RecoveryTrigger(case_id="case_pay_disp_1", payment_id="pay_disp_1", event_id="evt_disp_1")
    dispatcher = RecoveryJobDispatcher()
    result = dispatcher.dispatch_recovery_job(trigger, db_session)

    assert result is not None
    job = job_repo.get_by_id("job_case_pay_disp_1")
    assert job is not None
    assert job.status == "COMPLETED"
    assert job.correlation_id is not None
