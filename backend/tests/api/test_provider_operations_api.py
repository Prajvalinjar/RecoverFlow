import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
VALID_KEY = "test_ops_key_12345"


def test_get_provider_health_api():
    response = client.get(
        "/api/v1/operations/providers/health",
        headers={"X-Operations-Key": VALID_KEY, "X-Operations-Role": "VIEWER"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "providers" in data


def test_get_provider_config_api_no_secrets():
    response = client.get(
        "/api/v1/operations/providers/config",
        headers={"X-Operations-Key": VALID_KEY, "X-Operations-Role": "VIEWER"},
    )
    assert response.status_code == 200
    data = response.json()
    cfg = data["provider_config"]
    assert cfg["secrets_exposed"] is False
    assert "razorpay_key_secret" not in cfg
    assert "webhook_secret" not in cfg


def test_provider_api_authentication_failure():
    response = client.get(
        "/api/v1/operations/providers/health",
        headers={"X-Operations-Key": "INVALID_KEY"},
    )
    assert response.status_code == 401
