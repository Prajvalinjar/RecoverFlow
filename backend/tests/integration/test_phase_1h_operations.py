import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.connection import Base
from app.database.session import get_db
from app.execution.circuit_breaker import CircuitBreaker, CircuitBreakerConfig, CircuitState, ProviderCircuitOpenError
from app.execution.provider_health import ProviderHealthMonitor, ProviderHealthStatus
from app.recovery.operations import RecoveryOperationsController
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus
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


def test_scenario_a_healthy_system() -> None:
    res = client.get("/api/v1/operations/health", headers=HEADERS_VIEWER)
    assert res.status_code == 200
    assert res.json()["overall_status"] == "HEALTHY"


def test_scenario_b_provider_degradation_and_circuit_breaker() -> None:
    monitor = ProviderHealthMonitor()
    monitor.reset()
    cb = CircuitBreaker(config=CircuitBreakerConfig(failure_threshold=2))

    cb.record_failure()
    monitor.record_failure("SIMULATED_PROVIDER", "Err 1")
    assert cb.state == CircuitState.CLOSED

    cb.record_failure()
    monitor.record_failure("SIMULATED_PROVIDER", "Err 2")
    assert cb.state == CircuitState.OPEN
    assert monitor.get_health("SIMULATED_PROVIDER").status == ProviderHealthStatus.DEGRADED

    with pytest.raises(ProviderCircuitOpenError):
        cb.allow_request()


def test_scenario_c_and_d_operational_pause_and_resume() -> None:
    controller = RecoveryOperationsController()
    controller.reset_for_tests()

    # Pause via API
    res_pause = client.post("/api/v1/operations/recovery/pause", headers=HEADERS_OPERATOR)
    assert res_pause.status_code == 200
    assert controller.can_execute_new_jobs() is False

    # Resume via API
    res_resume = client.post("/api/v1/operations/recovery/resume", headers=HEADERS_OPERATOR)
    assert res_resume.status_code == 200
    assert controller.can_execute_new_jobs() is True


def test_scenario_j_safety_boundary_and_rbac() -> None:
    # 1. VIEWER cannot pause operations
    res_forbidden = client.post("/api/v1/operations/recovery/pause", headers=HEADERS_VIEWER)
    assert res_forbidden.status_code == 403

    # 2. AI or direct unapproved object passed to ExecutionProviderRouter raises PolicyApprovalRequiredError
    router = ExecutionProviderRouter()
    with pytest.raises(PolicyApprovalRequiredError):
        router.execute("DIRECT_AGENT_DECISION_OBJECT")  # type: ignore
