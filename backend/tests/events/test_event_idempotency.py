import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.events.consumer import EventConsumerIdempotencyService


@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_event_idempotency_different_consumers(db) -> None:
    svc = EventConsumerIdempotencyService(db)
    is_dup1, _ = svc.record_processed("evt_idemp_1", "consumer_A", "PAYMENT_FAILURE_RECEIVED")
    is_dup2, _ = svc.record_processed("evt_idemp_1", "consumer_B", "PAYMENT_FAILURE_RECEIVED")

    assert is_dup1 is False
    assert is_dup2 is False
