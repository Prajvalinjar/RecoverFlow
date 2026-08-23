import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.recovery.job_operations import RecoveryJobOperationsService, InvalidJobStateOperationError
from app.repository.postgres import PostgresRecoveryJobRepository, PostgresRecoveryCaseRepository, PostgresCustomerRepository, PostgresPaymentRepository
from app.repository.models import RecoveryJobModel, CustomerModel, PaymentModel, RecoveryCaseModel


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


def test_retry_eligible_failed_job(db_session) -> None:
    db_session.add(CustomerModel(id="cust_job_op_1"))
    db_session.add(PaymentModel(id="pay_job_op_1", customer_id="cust_job_op_1", amount=1000.0, status="FAILED"))
    db_session.add(RecoveryCaseModel(id="case_job_op_1", payment_id="pay_job_op_1", customer_id="cust_job_op_1", state="DETECTED"))
    db_session.add(RecoveryJobModel(job_id="job_op_1", case_id="case_job_op_1", trigger_id="trig_1", status="FAILED", attempt_number=1, max_attempts=3))
    db_session.commit()

    job_ops = RecoveryJobOperationsService(db_session)
    retried_job = job_ops.retry_job("job_op_1", actor="OPERATOR")

    assert retried_job.status == "RETRY_SCHEDULED"


def test_reject_retry_exceeding_max_attempts(db_session) -> None:
    db_session.add(CustomerModel(id="cust_job_op_2"))
    db_session.add(PaymentModel(id="pay_job_op_2", customer_id="cust_job_op_2", amount=1000.0, status="FAILED"))
    db_session.add(RecoveryCaseModel(id="case_job_op_2", payment_id="pay_job_op_2", customer_id="cust_job_op_2", state="DETECTED"))
    db_session.add(RecoveryJobModel(job_id="job_op_2", case_id="case_job_op_2", trigger_id="trig_2", status="FAILED", attempt_number=3, max_attempts=3))
    db_session.commit()

    job_ops = RecoveryJobOperationsService(db_session)
    with pytest.raises(InvalidJobStateOperationError):
        job_ops.retry_job("job_op_2", actor="OPERATOR")


def test_cancel_eligible_queued_job(db_session) -> None:
    db_session.add(CustomerModel(id="cust_job_op_3"))
    db_session.add(PaymentModel(id="pay_job_op_3", customer_id="cust_job_op_3", amount=1000.0, status="FAILED"))
    db_session.add(RecoveryCaseModel(id="case_job_op_3", payment_id="pay_job_op_3", customer_id="cust_job_op_3", state="DETECTED"))
    db_session.add(RecoveryJobModel(job_id="job_op_3", case_id="case_job_op_3", trigger_id="trig_3", status="QUEUED", attempt_number=1, max_attempts=3))
    db_session.commit()

    job_ops = RecoveryJobOperationsService(db_session)
    cancelled_job = job_ops.cancel_job("job_op_3", reason="Testing cancellation", actor="OPERATOR")

    assert cancelled_job.status == "CANCELLED"


def test_requeue_dead_letter_job(db_session) -> None:
    db_session.add(CustomerModel(id="cust_job_op_4"))
    db_session.add(PaymentModel(id="pay_job_op_4", customer_id="cust_job_op_4", amount=1000.0, status="FAILED"))
    db_session.add(RecoveryCaseModel(id="case_job_op_4", payment_id="pay_job_op_4", customer_id="cust_job_op_4", state="DETECTED"))
    db_session.add(RecoveryJobModel(job_id="job_op_4", case_id="case_job_op_4", trigger_id="trig_4", status="DEAD_LETTERED", attempt_number=3, max_attempts=3))
    db_session.commit()

    job_ops = RecoveryJobOperationsService(db_session)
    requeued = job_ops.requeue_dead_letter("job_op_4", actor="OPERATOR")

    assert requeued.status == "QUEUED"
