import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel, RecoveryAttemptModel, RecoveryJobModel, AuditEventModel
from app.data.sandbox_seeder import seed_sandbox_data, is_seeding_enabled


@pytest.fixture
def memory_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_seeding_disabled_by_default(memory_db, monkeypatch):
    monkeypatch.delenv("RECOVERFLOW_SEED_SANDBOX", raising=False)
    assert not is_seeding_enabled()
    
    seeded = seed_sandbox_data(memory_db)
    assert seeded is False
    assert memory_db.query(CustomerModel).count() == 0
    assert memory_db.query(PaymentModel).count() == 0
    assert memory_db.query(RecoveryCaseModel).count() == 0


def test_seeding_disabled_when_not_true(memory_db, monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_SEED_SANDBOX", "false")
    assert not is_seeding_enabled()
    
    seeded = seed_sandbox_data(memory_db)
    assert seeded is False
    assert memory_db.query(RecoveryCaseModel).count() == 0


def test_seeding_enabled_with_empty_database(memory_db, monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_SEED_SANDBOX", "true")
    assert is_seeding_enabled()
    
    seeded = seed_sandbox_data(memory_db)
    assert seeded is True

    # Verify counts
    assert memory_db.query(CustomerModel).count() == 10
    assert memory_db.query(PaymentModel).count() == 10
    assert memory_db.query(RecoveryCaseModel).count() == 10
    assert memory_db.query(RecoveryAttemptModel).count() == 10
    assert memory_db.query(RecoveryJobModel).count() == 5
    assert memory_db.query(AuditEventModel).count() == 3

    # Verify source marker
    for cust in memory_db.query(CustomerModel).all():
        assert cust.data_source == "SANDBOX_SEED"
        assert cust.external_customer_id == "SANDBOX_SEED"

    for pay in memory_db.query(PaymentModel).all():
        assert pay.data_source == "SANDBOX_SEED"
        assert pay.provider_payment_id == "sandbox_seed"

    for case in memory_db.query(RecoveryCaseModel).all():
        assert case.data_source == "SANDBOX_SEED"


def test_existing_records_prevent_seeding(memory_db, monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_SEED_SANDBOX", "true")
    
    # Pre-insert a single genuine customer
    existing_cust = CustomerModel(
        id="cust_existing_real_001",
        data_source="LIVE_DATABASE",
        segment="ENTERPRISE",
    )
    memory_db.add(existing_cust)
    memory_db.commit()

    seeded = seed_sandbox_data(memory_db)
    assert seeded is False

    # Verify existing record unchanged and no new records created
    assert memory_db.query(CustomerModel).count() == 1
    assert memory_db.query(CustomerModel).first().id == "cust_existing_real_001"
    assert memory_db.query(RecoveryCaseModel).count() == 0


def test_idempotent_seeding_repeated_call(memory_db, monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_SEED_SANDBOX", "true")
    
    # First seed run
    seeded_first = seed_sandbox_data(memory_db)
    assert seeded_first is True
    assert memory_db.query(RecoveryCaseModel).count() == 10

    # Second seed run (simulating repeated startup)
    seeded_second = seed_sandbox_data(memory_db)
    assert seeded_second is False

    # Records are not duplicated
    assert memory_db.query(CustomerModel).count() == 10
    assert memory_db.query(PaymentModel).count() == 10
    assert memory_db.query(RecoveryCaseModel).count() == 10
