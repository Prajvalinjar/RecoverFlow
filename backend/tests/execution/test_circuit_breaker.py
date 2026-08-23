from datetime import datetime, timedelta
import pytest
from app.execution.circuit_breaker import CircuitBreaker, CircuitBreakerConfig, CircuitState, ProviderCircuitOpenError


class ControllableClock:
    def __init__(self, start_time: Optional[datetime] = None) -> None:
        self.now = start_time or datetime(2026, 8, 22, 12, 0, 0)

    def advance(self, seconds: float) -> None:
        self.now += timedelta(seconds=seconds)

    def __call__(self) -> datetime:
        return self.now


def test_circuit_breaker_closed_allows_requests() -> None:
    cb = CircuitBreaker()
    assert cb.state == CircuitState.CLOSED
    assert cb.allow_request() is True


def test_circuit_breaker_opens_after_failure_threshold() -> None:
    config = CircuitBreakerConfig(failure_threshold=3)
    cb = CircuitBreaker(config=config)

    cb.record_failure()
    cb.record_failure()
    assert cb.state == CircuitState.CLOSED

    cb.record_failure()
    assert cb.state == CircuitState.OPEN

    with pytest.raises(ProviderCircuitOpenError):
        cb.allow_request()


def test_circuit_breaker_open_to_half_open_transition() -> None:
    clock = ControllableClock()
    config = CircuitBreakerConfig(failure_threshold=2, recovery_timeout_seconds=30.0)
    cb = CircuitBreaker(config=config, clock=clock)

    cb.record_failure()
    cb.record_failure()
    assert cb.state == CircuitState.OPEN

    # Advance clock by 10s (still open)
    clock.advance(10.0)
    assert cb.state == CircuitState.OPEN

    # Advance clock by 25s (total 35s > 30s timeout) -> transitions to HALF_OPEN
    clock.advance(25.0)
    assert cb.state == CircuitState.HALF_OPEN
    assert cb.allow_request() is True


def test_circuit_breaker_half_open_probe_success_closes_circuit() -> None:
    clock = ControllableClock()
    config = CircuitBreakerConfig(failure_threshold=2, recovery_timeout_seconds=30.0)
    cb = CircuitBreaker(config=config, clock=clock)

    cb.record_failure()
    cb.record_failure()
    clock.advance(35.0)
    assert cb.state == CircuitState.HALF_OPEN

    # Probe request succeeds
    cb.record_success()
    assert cb.state == CircuitState.CLOSED


def test_circuit_breaker_half_open_probe_failure_reopens_circuit() -> None:
    clock = ControllableClock()
    config = CircuitBreakerConfig(failure_threshold=2, recovery_timeout_seconds=30.0)
    cb = CircuitBreaker(config=config, clock=clock)

    cb.record_failure()
    cb.record_failure()
    clock.advance(35.0)
    assert cb.state == CircuitState.HALF_OPEN

    # Probe request fails
    cb.record_failure()
    assert cb.state == CircuitState.OPEN
