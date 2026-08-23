import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.connection import Base
from app.database.session import get_db

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


def test_full_phase_1g_integration_flow() -> None:
    # 1. Post payment failure webhook event
    payload = {
        "event_id": "evt_p1g_e2e_001",
        "payment_id": "pay_p1g_001",
        "customer_id": "cust_p1g_001",
        "amount": 4999.00,
        "currency": "INR",
        "failure_code": "BANK_TIMEOUT",
    }
    response = client.post("/api/v1/events/payment-failure", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "accepted"
    case_id = res_data["case_id"]

    # 2. Get consolidated case status
    status_res = client.get(f"/api/v1/recovery/cases/{case_id}/status")
    assert status_res.status_code == 200
    s_data = status_res.json()
    assert s_data["case_id"] == case_id
    assert s_data["state"] in ["RECOVERED", "FAILED", "STOPPED", "DETECTED"]
    assert s_data["latest_job"] is not None

    # 3. Get job status
    job_id = f"job_{case_id}"
    job_res = client.get(f"/api/v1/recovery/jobs/{job_id}")
    assert job_res.status_code == 200
    j_data = job_res.json()
    assert j_data["status"] == "COMPLETED"
    assert j_data["correlation_id"] is not None

    # 4. Get executions list
    exec_res = client.get(f"/api/v1/recovery/cases/{case_id}/executions")
    assert exec_res.status_code == 200
    e_data = exec_res.json()
    assert e_data["execution_count"] > 0

    # 5. Check operational metrics
    metrics_res = client.get("/api/v1/metrics")
    assert metrics_res.status_code == 200
    m_data = metrics_res.json()
    assert m_data["status"] == "ok"
    assert "metrics" in m_data
