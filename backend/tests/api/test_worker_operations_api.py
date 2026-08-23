import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.security.config import get_security_config

client = TestClient(app)
sec_config = get_security_config()
headers_admin = {"X-Operations-Key": sec_config.operations_api_key, "X-Operations-Role": "ADMIN"}


def test_worker_operations_api_list_and_status() -> None:
    res = client.get("/api/v1/operations/workers", headers=headers_admin)
    assert res.status_code == 200
    data = res.json()
    assert "workers" in data


def test_queue_status_and_backpressure_api() -> None:
    res = client.get("/api/v1/operations/queue/status", headers=headers_admin)
    assert res.status_code == 200
    data = res.json()
    assert "backpressure_level" in data

    res_bp = client.get("/api/v1/operations/backpressure", headers=headers_admin)
    assert res_bp.status_code == 200
    assert "level" in res_bp.json()
