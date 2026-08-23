import pytest
from app.execution.provider_health import ProviderHealthMonitor, ProviderHealthStatus


def test_provider_health_consecutive_success_tracking() -> None:
    monitor = ProviderHealthMonitor()
    monitor.reset()

    health = monitor.record_success("TEST_PROVIDER")
    assert health.status == ProviderHealthStatus.HEALTHY
    assert health.consecutive_successes == 1
    assert health.consecutive_failures == 0


def test_provider_health_failure_degradation_and_unavailability() -> None:
    monitor = ProviderHealthMonitor(failure_threshold=3, degradation_threshold=2)
    monitor.reset()

    # 1 failure -> HEALTHY
    h1 = monitor.record_failure("TEST_PROVIDER", "Err 1")
    assert h1.status == ProviderHealthStatus.HEALTHY

    # 2 failures -> DEGRADED
    h2 = monitor.record_failure("TEST_PROVIDER", "Err 2")
    assert h2.status == ProviderHealthStatus.DEGRADED

    # 3 failures -> UNAVAILABLE
    h3 = monitor.record_failure("TEST_PROVIDER", "Err 3")
    assert h3.status == ProviderHealthStatus.UNAVAILABLE


def test_provider_health_recovery_on_success() -> None:
    monitor = ProviderHealthMonitor()
    monitor.reset()

    monitor.record_failure("TEST_PROVIDER", "Err 1")
    monitor.record_failure("TEST_PROVIDER", "Err 2")
    monitor.record_failure("TEST_PROVIDER", "Err 3")

    # Success resets consecutive failures and clears UNAVAILABLE status
    rec = monitor.record_success("TEST_PROVIDER")
    assert rec.status == ProviderHealthStatus.HEALTHY
    assert rec.consecutive_failures == 0
