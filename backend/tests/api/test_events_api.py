from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.connection import Base
from app.database.session import get_db

# Isolated testing DB engine for API tests using StaticPool to preserve memory DB
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_payment_failure_event_validation() -> None:
    # Invalid amount <= 0
    payload = {
        "event_id": "evt_val_001",
        "payment_id": "pay_val_001",
        "customer_id": "cust_val_001",
        "amount": 0,
        "failure_code": "BANK_TIMEOUT",
    }
    response = client.post("/api/v1/events/payment-failure", json=payload)
    assert response.status_code == 422

    # Invalid failure_code
    payload_bad_code = {
        "event_id": "evt_val_002",
        "payment_id": "pay_val_002",
        "customer_id": "cust_val_002",
        "amount": 1000,
        "failure_code": "NON_EXISTENT_FAILURE_CODE",
    }
    response2 = client.post("/api/v1/events/payment-failure", json=payload_bad_code)
    assert response2.status_code == 422


def test_unauthorized_event_rejected(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("EVENT_AUTH_SECRET", "super_secret_key")

    payload = {
        "event_id": "evt_auth_001",
        "payment_id": "pay_auth_001",
        "customer_id": "cust_auth_001",
        "amount": 1500,
        "failure_code": "BANK_TIMEOUT",
    }
    # No auth header passed in production mode
    response = client.post("/api/v1/events/payment-failure", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"]["error_code"] == "EVENT_AUTHENTICATION_FAILED"


def test_case_created_from_valid_event() -> None:
    payload = {
        "event_id": "evt_api_test_001",
        "payment_id": "pay_api_test_001",
        "customer_id": "cust_api_test_001",
        "amount": 2500,
        "currency": "INR",
        "failure_code": "BANK_TIMEOUT",
    }
    response = client.post("/api/v1/events/payment-failure", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert data["duplicate"] is False
    assert data["case_id"] is not None


def test_duplicate_event_is_idempotent() -> None:
    payload = {
        "event_id": "evt_api_dup_001",
        "payment_id": "pay_api_dup_001",
        "customer_id": "cust_api_dup_001",
        "amount": 3500,
        "currency": "INR",
        "failure_code": "INSUFFICIENT_FUNDS",
    }
    res1 = client.post("/api/v1/events/payment-failure", json=payload)
    assert res1.status_code == 200
    assert res1.json()["status"] == "accepted"

    # Resubmit identical event ID
    res2 = client.post("/api/v1/events/payment-failure", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "already_processed"
    assert data2["duplicate"] is True


def test_read_endpoint_is_side_effect_free() -> None:
    payload = {
        "event_id": "evt_read_test_001",
        "payment_id": "pay_read_test_001",
        "customer_id": "cust_read_test_001",
        "amount": 1200,
        "failure_code": "BANK_TIMEOUT",
    }
    res = client.post("/api/v1/events/payment-failure", json=payload)
    case_id = res.json()["case_id"]

    # Read case endpoint
    case_res1 = client.get(f"/api/v1/recovery/cases/{case_id}")
    assert case_res1.status_code == 200

    case_res2 = client.get(f"/api/v1/recovery/cases/{case_id}")
    assert case_res2.status_code == 200

    # Ensure state remains unmutated by read calls
    assert case_res1.json()["state"] == case_res2.json()["state"]


def test_timeline_endpoint_returns_chronological_events() -> None:
    payload = {
        "event_id": "evt_timeline_001",
        "payment_id": "pay_timeline_001",
        "customer_id": "cust_timeline_001",
        "amount": 4999,
        "failure_code": "BANK_TIMEOUT",
    }
    res = client.post("/api/v1/events/payment-failure", json=payload)
    case_id = res.json()["case_id"]

    timeline_res = client.get(f"/api/v1/recovery/cases/{case_id}/timeline")
    assert timeline_res.status_code == 200
    t_data = timeline_res.json()
    assert t_data["case_id"] == case_id
    assert t_data["event_count"] > 0
    assert isinstance(t_data["timeline"], list)
