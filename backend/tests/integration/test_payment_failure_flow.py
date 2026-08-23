from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.connection import Base
from app.database.session import get_db

# Isolated testing DB engine
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


def test_full_payment_failure_integration_flow() -> None:
    # 1. Post payment failure webhook event
    payload = {
        "event_id": "evt_e2e_integration_001",
        "payment_id": "pay_e2e_001",
        "customer_id": "cust_e2e_001",
        "amount": 4999.00,
        "currency": "INR",
        "failure_code": "BANK_TIMEOUT",
    }
    response = client.post("/api/v1/events/payment-failure", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "accepted"
    case_id = res_data["case_id"]
    assert case_id == "case_pay_e2e_001"

    # 2. Verify case read endpoint
    case_res = client.get(f"/api/v1/recovery/cases/{case_id}")
    assert case_res.status_code == 200
    case_data = case_res.json()
    assert case_data["case_id"] == case_id
    assert case_data["state"] in ["RECOVERED", "FAILED", "STOPPED", "DETECTED"]

    # 3. Verify timeline endpoint
    timeline_res = client.get(f"/api/v1/recovery/cases/{case_id}/timeline")
    assert timeline_res.status_code == 200
    t_data = timeline_res.json()
    assert t_data["case_id"] == case_id
    assert t_data["event_count"] > 0

    # 4. Verify payment endpoint
    pay_res = client.get("/api/v1/payments/pay_e2e_001")
    assert pay_res.status_code == 200
    pay_data = pay_res.json()
    assert pay_data["payment_id"] == "pay_e2e_001"
    assert pay_data["amount"] == "4999.0" or pay_data["amount"] == "4999.00"

    # 5. Verify Idempotency on duplicate submission
    dup_res = client.post("/api/v1/events/payment-failure", json=payload)
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["status"] == "already_processed"
    assert dup_data["duplicate"] is True
    assert dup_data["case_id"] == case_id
