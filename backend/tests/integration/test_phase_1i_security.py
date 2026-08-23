import hmac
import hashlib
import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.connection import Base
from app.database.session import get_db
from app.security.config import reset_security_config, SecurityConfig, SecurityConfigurationError
from app.security.replay import replay_protection_service
from app.security.rate_limit import rate_limiter
from app.domain.orchestrator import PolicyApprovalRequiredError
from app.execution.router import ExecutionProviderRouter

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

HEADERS_VIEWER = {"X-Operations-Key": "dev_ops_secret_key", "X-Operations-Role": "VIEWER"}
HEADERS_OPERATOR = {"X-Operations-Key": "dev_ops_secret_key", "X-Operations-Role": "OPERATOR"}
HEADERS_ADMIN = {"X-Operations-Key": "dev_ops_secret_key", "X-Operations-Role": "ADMIN"}


@pytest.fixture(autouse=True)
def reset_security_stores():
    replay_protection_service.store.reset()
    rate_limiter.reset()
    yield
    replay_protection_service.store.reset()
    rate_limiter.reset()


import json


def test_scenario_a_valid_webhook_accepted() -> None:
    payload = {
        "event_id": "evt_sec_a_001",
        "event_type": "payment.failed",
        "payment_id": "pay_sec_a_001",
        "customer_id": "cust_sec_a_001",
        "amount": 3500.0,
        "currency": "INR",
        "failure_code": "INSUFFICIENT_FUNDS",
        "occurred_at": "2026-08-22T19:00:00Z",
    }
    raw_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = hmac.new(b"dev_webhook_secret_key", raw_bytes, hashlib.sha256).hexdigest()

    res = client.post(
        "/api/v1/events/payment-failure",
        json=payload,
        headers={"X-Signature": sig, "X-Event-Secret": "dev_webhook_secret_key"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "accepted"


def test_scenario_b_invalid_webhook_signature_rejected() -> None:
    payload = {
        "event_id": "evt_sec_b_001",
        "event_type": "payment.failed",
        "payment_id": "pay_sec_b_001",
        "customer_id": "cust_sec_b_001",
        "amount": 3500.0,
        "currency": "INR",
        "failure_code": "INSUFFICIENT_FUNDS",
        "occurred_at": "2026-08-22T19:00:00Z",
    }
    res = client.post(
        "/api/v1/events/payment-failure",
        json=payload,
        headers={"X-Signature": "invalid_sig_hash_9999", "X-Event-Secret": "wrong_secret"},
    )
    assert res.status_code == 401
    assert res.json()["error"] in ("INVALID_SIGNATURE", "AUTHENTICATION_FAILED")


def test_scenario_c_expired_webhook_rejected() -> None:
    payload = {
        "event_id": "evt_sec_c_001",
        "event_type": "payment.failed",
        "payment_id": "pay_sec_c_001",
        "customer_id": "cust_sec_c_001",
        "amount": 3500.0,
        "currency": "INR",
        "failure_code": "INSUFFICIENT_FUNDS",
        "occurred_at": "2026-08-22T19:00:00Z",
    }
    expired_ts = str(time.time() - 1000)

    res = client.post(
        "/api/v1/events/payment-failure",
        json=payload,
        headers={
            "X-Signature": "dummy_sig",
            "X-Signature-Timestamp": expired_ts,
            "X-Event-Secret": "dev_webhook_secret_key",
        },
    )
    assert res.status_code == 401
    assert res.json()["error"] in ("EXPIRED_WEBHOOK", "AUTHENTICATION_FAILED")


def test_scenario_d_and_e_replay_attack_rejected() -> None:
    payload = {
        "event_id": "evt_sec_d_001",
        "event_type": "payment.failed",
        "payment_id": "pay_sec_d_001",
        "customer_id": "cust_sec_d_001",
        "amount": 3500.0,
        "currency": "INR",
        "failure_code": "INSUFFICIENT_FUNDS",
        "occurred_at": "2026-08-22T19:00:00Z",
    }
    raw_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = hmac.new(b"dev_webhook_secret_key", raw_bytes, hashlib.sha256).hexdigest()

    # Request 1: Accepted
    res1 = client.post(
        "/api/v1/events/payment-failure",
        json=payload,
        headers={"X-Signature": sig, "X-Event-Secret": "dev_webhook_secret_key"},
    )
    assert res1.status_code == 200

    # Request 2: Replay rejected
    res2 = client.post(
        "/api/v1/events/payment-failure",
        json=payload,
        headers={"X-Signature": sig, "X-Event-Secret": "dev_webhook_secret_key"},
    )
    assert res2.status_code == 401
    assert res2.json()["error"] == "REPLAY_REJECTED"


def test_scenario_f_g_h_rbac_authorization() -> None:
    # F: VIEWER cannot mutate
    res_v = client.post("/api/v1/operations/recovery/pause", headers=HEADERS_VIEWER)
    assert res_v.status_code == 403

    # G: OPERATOR can mutate
    res_o = client.post("/api/v1/operations/recovery/pause", headers=HEADERS_OPERATOR)
    assert res_o.status_code == 200

    # H: ADMIN can resume
    res_a = client.post("/api/v1/operations/recovery/resume", headers=HEADERS_ADMIN)
    assert res_a.status_code == 200


def test_scenario_j_missing_production_secret_fails_closed(monkeypatch) -> None:
    monkeypatch.setenv("RECOVERFLOW_ENVIRONMENT", "production")
    monkeypatch.delenv("RECOVERFLOW_WEBHOOK_SECRET", raising=False)
    monkeypatch.delenv("RECOVERFLOW_OPERATIONS_KEY", raising=False)
    reset_security_config()

    with pytest.raises(SecurityConfigurationError):
        SecurityConfig.load_from_env()

    reset_security_config()


def test_scenario_k_correlation_id_propagation() -> None:
    corr_id = "corr_integration_test_k_999"
    res = client.get("/api/v1/operations/health", headers={**HEADERS_VIEWER, "X-Correlation-ID": corr_id})
    assert res.status_code == 200
    assert res.headers.get("X-Correlation-ID") == corr_id


def test_scenario_l_ai_execution_isolation() -> None:
    router = ExecutionProviderRouter()
    with pytest.raises(PolicyApprovalRequiredError):
        router.execute("UNAPPROVED_AI_AGENT_OBJECT")  # type: ignore
