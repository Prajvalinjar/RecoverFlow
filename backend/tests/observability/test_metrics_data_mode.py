import os
import pytest
from decimal import Decimal
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel
from app.repository.postgres import PostgresRecoveryCaseRepository, PostgresPaymentRepository
from app.observability.recovery_metrics import RecoveryMetricsService
from app.data.sandbox_seeder import seed_sandbox_data


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_empty_database_in_auto_mode_without_seeding(test_db, monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_DATA_MODE", "AUTO")
    monkeypatch.setenv("RECOVERFLOW_SEED_SANDBOX", "false")

    case_repo = PostgresRecoveryCaseRepository(test_db)
    pay_repo = PostgresPaymentRepository(test_db)
    service = RecoveryMetricsService(case_repo=case_repo, payment_repo=pay_repo)
    metrics = service.get_metrics()

    assert metrics.data_source == "EMPTY_DATABASE"
    assert metrics.is_sandbox_baseline is False
    assert metrics.total_cases == 0
    assert metrics.active_cases == 0
    assert metrics.revenue_at_risk == Decimal("0.00")
    assert metrics.revenue_recovered == Decimal("0.00")
    assert metrics.recovery_rate == 0.0


def test_empty_database_in_sandbox_mode(test_db, monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_DATA_MODE", "SANDBOX")

    case_repo = PostgresRecoveryCaseRepository(test_db)
    pay_repo = PostgresPaymentRepository(test_db)
    service = RecoveryMetricsService(case_repo=case_repo, payment_repo=pay_repo)
    metrics = service.get_metrics()

    assert metrics.data_source == "SANDBOX_BASELINE"
    assert metrics.is_sandbox_baseline is True
    assert metrics.total_cases == 1240
    assert metrics.active_cases == 142
    assert metrics.recovered_cases == 921
    assert metrics.revenue_at_risk == Decimal("245680.00")
    assert metrics.revenue_recovered == Decimal("182450.00")
    assert metrics.recovery_rate == 74.26


def test_empty_database_in_live_mode(test_db, monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_DATA_MODE", "LIVE")

    case_repo = PostgresRecoveryCaseRepository(test_db)
    pay_repo = PostgresPaymentRepository(test_db)
    service = RecoveryMetricsService(case_repo=case_repo, payment_repo=pay_repo)
    metrics = service.get_metrics()

    assert metrics.data_source == "EMPTY_DATABASE"
    assert metrics.is_sandbox_baseline is False
    assert metrics.total_cases == 0
    assert metrics.revenue_at_risk == Decimal("0.00")


def test_seeded_database_returns_sandbox_seed_source(test_db, monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_DATA_MODE", "AUTO")
    monkeypatch.setenv("RECOVERFLOW_SEED_SANDBOX", "true")

    # Seed curated sandbox data
    seed_sandbox_data(test_db)

    case_repo = PostgresRecoveryCaseRepository(test_db)
    pay_repo = PostgresPaymentRepository(test_db)
    service = RecoveryMetricsService(case_repo=case_repo, payment_repo=pay_repo)
    metrics = service.get_metrics()

    # Must return approved sandbox aggregate values, clearly marked as SANDBOX_SEED
    assert metrics.data_source == "SANDBOX_SEED"
    assert metrics.is_sandbox_baseline is True
    assert metrics.total_cases == 1240
    assert metrics.active_cases == 142
    assert metrics.revenue_at_risk == Decimal("245680.00")
    assert metrics.revenue_recovered == Decimal("182450.00")
    assert metrics.recovery_rate == 74.26


def test_genuine_records_return_live_database_mode(test_db, monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_DATA_MODE", "AUTO")

    # Create genuine customer, payment, case
    cust = CustomerModel(id="cust_real_001", data_source="LIVE_DATABASE", segment="REGULAR")
    pay = PaymentModel(
        id="pay_real_001",
        customer_id="cust_real_001",
        amount=Decimal("500.00"),
        currency="USD",
        status="RECOVERED",
        failure_code="BANK_TIMEOUT",
        data_source="LIVE_DATABASE",
    )
    case = RecoveryCaseModel(
        id="case_real_001",
        payment_id="pay_real_001",
        customer_id="cust_real_001",
        state="RECOVERED",
        priority="HIGH",
        attempt_count=1,
        data_source="LIVE_DATABASE",
    )
    test_db.add_all([cust, pay, case])
    test_db.commit()

    case_repo = PostgresRecoveryCaseRepository(test_db)
    pay_repo = PostgresPaymentRepository(test_db)
    service = RecoveryMetricsService(case_repo=case_repo, payment_repo=pay_repo)
    metrics = service.get_metrics()

    assert metrics.data_source == "LIVE_DATABASE"
    assert metrics.is_sandbox_baseline is False
    assert metrics.total_cases == 1
    assert metrics.recovered_cases == 1
    assert metrics.revenue_at_risk == Decimal("500.00")
    assert metrics.revenue_recovered == Decimal("500.00")
    assert metrics.recovery_rate == 100.0


def test_api_operations_metrics_response_contract():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    headers = {"X-Operations-Key": "dev_ops_secret_key", "X-Operations-Role": "VIEWER"}
    res = client.get("/api/v1/operations/metrics", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "total_cases" in data
    assert "revenue_at_risk" in data
    assert "revenue_recovered" in data
    assert "is_sandbox_baseline" in data
    assert "data_source" in data
    assert data["data_source"] in ("SANDBOX_BASELINE", "SANDBOX_SEED", "LIVE_DATABASE", "EMPTY_DATABASE")


def test_health_endpoints_remain_functional():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    
    # Root /health
    res1 = client.get("/health")
    assert res1.status_code == 200
    assert res1.json()["status"] == "healthy"

    # API V1 /api/v1/health
    res2 = client.get("/api/v1/health")
    assert res2.status_code == 200
    assert res2.json()["status"] == "ok"
