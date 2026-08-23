import pytest
from app.observability.health import HealthCheckService, HealthStatus
from app.execution.provider_health import ProviderHealthMonitor, ProviderHealthStatus


def test_health_check_service_returns_healthy_system() -> None:
    service = HealthCheckService()
    system_health = service.check_system_health()

    assert system_health.overall_status == HealthStatus.HEALTHY
    assert len(system_health.components) >= 3


def test_health_check_degraded_provider_detection() -> None:
    monitor = ProviderHealthMonitor()
    monitor.reset()
    monitor.record_failure("SIMULATED_PROVIDER", "Transient timeout")
    monitor.record_failure("SIMULATED_PROVIDER", "Transient timeout 2")

    service = HealthCheckService(provider_health_monitor=monitor)
    system_health = service.check_system_health()

    assert system_health.overall_status in (HealthStatus.DEGRADED, HealthStatus.UNHEALTHY)


def test_health_check_service_is_side_effect_free() -> None:
    service = HealthCheckService()
    # Execute multiple times
    h1 = service.check_system_health()
    h2 = service.check_system_health()

    assert h1.overall_status == h2.overall_status
