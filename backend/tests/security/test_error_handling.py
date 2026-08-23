import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

HEADERS_VIEWER = {"X-Operations-Key": "dev_ops_secret_key", "X-Operations-Role": "VIEWER"}


def test_structured_error_response_contains_correlation_id() -> None:
    res = client.get("/api/v1/operations/cases/non_existent_case_id_123/summary", headers=HEADERS_VIEWER)
    assert res.status_code == 404
    data = res.json()
    assert "error" in data
    assert "correlation_id" in data
    assert res.headers.get("X-Correlation-ID") is not None


def test_unauthorized_error_format() -> None:
    res = client.get("/api/v1/operations/health", headers={"X-Operations-Key": "invalid_key"})
    assert res.status_code == 401
    data = res.json()
    assert data["error"] == "AUTHENTICATION_FAILED"
    assert "correlation_id" in data


def test_forbidden_error_format() -> None:
    res = client.post("/api/v1/operations/recovery/pause", headers=HEADERS_VIEWER)
    assert res.status_code == 403
    data = res.json()
    assert data["error"] == "FORBIDDEN"
    assert "correlation_id" in data
