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

HEADERS_VIEWER = {"X-Operations-Key": "dev_ops_secret_key", "X-Operations-Role": "VIEWER"}
HEADERS_OPERATOR = {"X-Operations-Key": "dev_ops_secret_key", "X-Operations-Role": "OPERATOR"}
HEADERS_INVALID_KEY = {"X-Operations-Key": "invalid_key", "X-Operations-Role": "OPERATOR"}


def test_operations_health_endpoint() -> None:
    res = client.get("/api/v1/operations/health", headers=HEADERS_VIEWER)
    assert res.status_code == 200
    data = res.json()
    assert data["overall_status"] == "HEALTHY"


def test_operations_metrics_endpoint() -> None:
    res = client.get("/api/v1/operations/metrics", headers=HEADERS_VIEWER)
    assert res.status_code == 200
    data = res.json()
    assert "total_cases" in data


def test_operations_providers_endpoint() -> None:
    res = client.get("/api/v1/operations/providers", headers=HEADERS_VIEWER)
    assert res.status_code == 200
    data = res.json()
    assert len(data["providers"]) > 0


def test_operations_status_endpoint() -> None:
    res = client.get("/api/v1/operations/recovery/status", headers=HEADERS_VIEWER)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("RUNNING", "PAUSED", "DRAINING", "STOPPED")


def test_operations_pause_requires_operator_role() -> None:
    # 1. Reject invalid key -> 401
    res1 = client.post("/api/v1/operations/recovery/pause", headers=HEADERS_INVALID_KEY)
    assert res1.status_code == 401

    # 2. Reject VIEWER role for write operation -> 403
    res2 = client.post("/api/v1/operations/recovery/pause", headers=HEADERS_VIEWER)
    assert res2.status_code == 403

    # 3. Accept OPERATOR role -> 200
    res3 = client.post("/api/v1/operations/recovery/pause", headers=HEADERS_OPERATOR)
    assert res3.status_code == 200
    assert res3.json()["status"] == "PAUSED"

    # Resume recovery
    res4 = client.post("/api/v1/operations/recovery/resume", headers=HEADERS_OPERATOR)
    assert res4.status_code == 200
    assert res4.json()["status"] == "RUNNING"
