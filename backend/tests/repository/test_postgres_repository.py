from decimal import Decimal
from datetime import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.repository.models import (
    CustomerModel,
    PaymentModel,
    RecoveryCaseModel,
    RecoveryAttemptModel,
    PaymentEventModel,
    AuditEventModel,
)
from app.repository.postgres import (
    PostgresCustomerRepository,
    PostgresPaymentRepository,
    PostgresRecoveryCaseRepository,
    PostgresRecoveryAttemptRepository,
    PostgresEventRepository,
    PostgresAuditRepository,
)


@pytest.fixture
def db_session():
    """Isolated in-memory SQLite database session fixture."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_create_customer(db_session) -> None:
    repo = PostgresCustomerRepository(db_session)
    cust = CustomerModel(
        id="cust_test_1",
        segment="PREMIUM",
        total_payments=10,
        successful_payments=9,
        failed_payments=1,
        total_spent=Decimal("50000.00"),
    )
    saved = repo.save(cust)
    db_session.commit()

    fetched = repo.get_by_id("cust_test_1")
    assert fetched is not None
    assert fetched.segment == "PREMIUM"
    assert fetched.total_spent == Decimal("50000.00")


def test_create_payment(db_session) -> None:
    cust_repo = PostgresCustomerRepository(db_session)
    pay_repo = PostgresPaymentRepository(db_session)

    cust = CustomerModel(id="cust_test_2", segment="REGULAR")
    cust_repo.save(cust)

    payment = PaymentModel(
        id="pay_test_2",
        customer_id="cust_test_2",
        amount=Decimal("2500.00"),
        status="FAILED",
        failure_code="BANK_TIMEOUT",
    )
    pay_repo.save(payment)
    db_session.commit()

    fetched = pay_repo.get_by_id("pay_test_2")
    assert fetched is not None
    assert fetched.amount == Decimal("2500.00")
    assert fetched.customer_id == "cust_test_2"


def test_create_case_and_attempts(db_session) -> None:
    cust_repo = PostgresCustomerRepository(db_session)
    pay_repo = PostgresPaymentRepository(db_session)
    case_repo = PostgresRecoveryCaseRepository(db_session)
    attempt_repo = PostgresRecoveryAttemptRepository(db_session)

    cust_repo.save(CustomerModel(id="cust_3", segment="REGULAR"))
    pay_repo.save(PaymentModel(id="pay_3", customer_id="cust_3", amount=Decimal("1000.00"), status="FAILED"))

    case = RecoveryCaseModel(id="case_3", payment_id="pay_3", customer_id="cust_3", state="DETECTED")
    case_repo.save(case)

    attempt = RecoveryAttemptModel(
        id="att_1",
        case_id="case_3",
        action_type="RETRY_IMMEDIATE",
        attempt_number=1,
        status="COMPLETED",
        outcome_status="RECOVERED",
        amount_recovered=Decimal("1000.00"),
    )
    attempt_repo.save(attempt)
    db_session.commit()

    fetched_case = case_repo.get_by_id("case_3")
    assert fetched_case is not None
    assert fetched_case.state == "DETECTED"

    attempts = attempt_repo.get_attempts_for_case("case_3")
    assert len(attempts) == 1
    assert attempts[0].action_type == "RETRY_IMMEDIATE"


def test_event_idempotency(db_session) -> None:
    event_repo = PostgresEventRepository(db_session)
    event1 = PaymentEventModel(
        id="pevt_1",
        provider_event_id="evt_uniq_123",
        event_type="payment.failed",
        payment_id="pay_123",
        customer_id="cust_123",
    )
    event_repo.save(event1)
    db_session.commit()

    fetched = event_repo.get_by_provider_event_id("evt_uniq_123")
    assert fetched is not None
    assert fetched.id == "pevt_1"


def test_transaction_rollback(db_session) -> None:
    pay_repo = PostgresPaymentRepository(db_session)
    payment = PaymentModel(id="pay_rollback", customer_id="cust_nonexistent", amount=Decimal("500.00"), status="FAILED")
    pay_repo.save(payment)

    # Rollback transaction explicitly
    db_session.rollback()

    fetched = pay_repo.get_by_id("pay_rollback")
    assert fetched is None
