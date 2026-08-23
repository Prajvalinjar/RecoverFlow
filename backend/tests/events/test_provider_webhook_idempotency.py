import pytest
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.events.processor import PaymentEventProcessor, AuthenticatedEventContext
from app.api.schemas.events import PaymentFailureEvent


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


def test_provider_webhook_idempotency(db_session):
    processor = PaymentEventProcessor(db_session)
    event = PaymentFailureEvent(
        event_id="evt_dup_200",
        event_type="PAYMENT_FAILURE_RECEIVED",
        payment_id="pay_dup_200",
        customer_id="cust_dup_200",
        amount=Decimal("150.00"),
        currency="INR",
        failure_code="BANK_TIMEOUT",
        occurred_at=datetime.now(timezone.utc),
    )
    sec_ctx = AuthenticatedEventContext(
        provider="razorpay",
        event_id="evt_dup_200",
        authenticated=True,
        correlation_id="corr_dup_200",
    )

    # First call
    res1 = processor.process_event(event, trigger_recovery=False, security_context=sec_ctx)
    assert res1.status == "accepted"
    assert res1.duplicate is False

    # Second call with same event_id and provider
    res2 = processor.process_event(event, trigger_recovery=False, security_context=sec_ctx)
    assert res2.status == "already_processed"
    assert res2.duplicate is True
