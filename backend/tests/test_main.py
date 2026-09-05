from fastapi.testclient import TestClient
from app.main import app

client: TestClient = TestClient(app)


def test_read_root() -> None:
    """Test API root identification endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "service": "recoverflow-api",
        "version": "0.1.0",
        "status": "running",
    }


def test_health_check() -> None:
    """Test API health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "recoverflow-api",
        "version": "0.1.0",
    }


def test_api_v1_health_get() -> None:
    """Test API V1 health check endpoint with GET."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "recoverflow-api",
        "version": "1.0.0",
    }


def test_api_v1_health_head() -> None:
    """Test API V1 health check endpoint with HEAD (used by UptimeRobot)."""
    response = client.head("/api/v1/health")
    assert response.status_code == 200

