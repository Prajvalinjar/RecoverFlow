from decimal import Decimal
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.api.schemas.events import PaymentFailureEvent
from app.events.processor import PaymentEventProcessor
from app.repository.postgres import (
    PostgresRecoveryCaseRepository,
    PostgresPaymentRepository,
    PostgresEventRepository,
)


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_new_payment_creates_case(db_session) -> None:
    event = PaymentFailureEvent(
        event_id="evt_proc_001",
        payment_id="pay_proc_001",
        customer_id="cust_proc_001",
        amount=Decimal("4999.00"),
        failure_code="BANK_TIMEOUT",
    )
    processor = PaymentEventProcessor(db_session)
    response = processor.process_event(event, trigger_recovery=True)

    assert response.status == "accepted"
    assert response.duplicate is False
    assert response.case_id == "case_pay_proc_001"

    case_repo = PostgresRecoveryCaseRepository(db_session)
    case = case_repo.get_by_id("case_pay_proc_001")
    assert case is not None
    assert case.payment_id == "pay_proc_001"


def test_existing_case_is_reused(db_session) -> None:
    event1 = PaymentFailureEvent(
        event_id="evt_proc_002a",
        payment_id="pay_proc_002",
        customer_id="cust_proc_002",
        amount=Decimal("1500.00"),
        failure_code="INSUFFICIENT_FUNDS",
    )
    processor = PaymentEventProcessor(db_session)
    res1 = processor.process_event(event1, trigger_recovery=False)
    case_id_1 = res1.case_id

    # Second event for same payment ID
    event2 = PaymentFailureEvent(
        event_id="evt_proc_002b",
        payment_id="pay_proc_002",
        customer_id="cust_proc_002",
        amount=Decimal("1500.00"),
        failure_code="INSUFFICIENT_FUNDS",
    )
    res2 = processor.process_event(event2, trigger_recovery=False)
    assert res2.case_id == case_id_1


def test_event_processing_is_idempotent(db_session) -> None:
    event = PaymentFailureEvent(
        event_id="evt_idempotent_001",
        payment_id="pay_idempotent_001",
        customer_id="cust_idempotent_001",
        amount=Decimal("2000.00"),
        failure_code="BANK_TIMEOUT",
    )
    processor = PaymentEventProcessor(db_session)
    res1 = processor.process_event(event, trigger_recovery=True)
    assert res1.status == "accepted"

    # Resubmit identical provider event ID
    res2 = processor.process_event(event, trigger_recovery=True)
    assert res2.status == "already_processed"
    assert res2.duplicate is True


def test_processing_failure_rolls_back(db_session) -> None:
    # Malformed / invalid trigger condition
    event = PaymentFailureEvent(
        event_id="evt_fail_rb",
        payment_id="pay_fail_rb",
        customer_id="cust_fail_rb",
        amount=Decimal("1000.00"),
        failure_code="BANK_TIMEOUT",
    )
    processor = PaymentEventProcessor(db_session)
    
    # Process event
    res = processor.process_event(event, trigger_recovery=False)
    assert res.status == "accepted"

    # Verify event record persisted
    event_repo = PostgresEventRepository(db_session)
    assert event_repo.get_by_provider_event_id("evt_fail_rb") is not None
