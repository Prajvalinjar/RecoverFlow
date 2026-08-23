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


def test_event_consumer_idempotency_service(db) -> None:
    svc = EventConsumerIdempotencyService(db)
    is_dup1, rec1 = svc.record_processed("evt_c1", "worker_1", "PAYMENT_FAILURE_RECEIVED")
    assert is_dup1 is False
    assert rec1.event_id == "evt_c1"

    is_dup2, rec2 = svc.record_processed("evt_c1", "worker_1", "PAYMENT_FAILURE_RECEIVED")
    assert is_dup2 is True
    assert rec2.event_id == "evt_c1"
