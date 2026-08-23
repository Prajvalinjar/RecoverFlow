import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.api.schemas.events import PaymentFailureEvent
from app.events.processor import PaymentEventProcessor
from app.repository.postgres import PostgresEventRepository


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


def test_concurrent_duplicate_webhook_delivery_idempotency(db_session) -> None:
    event = PaymentFailureEvent(
        event_id="evt_conc_001",
        payment_id="pay_conc_001",
        customer_id="cust_conc_001",
        amount=4999.00,
        failure_code="BANK_TIMEOUT",
    )
    processor = PaymentEventProcessor(db_session)

    # First event ingestion
    res1 = processor.process_event(event, trigger_recovery=True)
    assert res1.status == "accepted"
    assert res1.duplicate is False

    # Second event ingestion with identical provider_event_id
    res2 = processor.process_event(event, trigger_recovery=True)
    assert res2.status == "already_processed"
    assert res2.duplicate is True

    # Verify only single payment_event record exists in DB
    event_repo = PostgresEventRepository(db_session)
    evt_record = event_repo.get_by_provider_event_id("evt_conc_001")
    assert evt_record is not None
