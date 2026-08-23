from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Callable
from threading import Lock


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class ProviderCircuitOpenError(Exception):
    """Raised when an execution request is attempted while the circuit breaker is OPEN."""
    pass


@dataclass
class CircuitBreakerConfig:
    failure_threshold: int = 3
    recovery_timeout_seconds: float = 30.0
    half_open_max_probe_calls: int = 1


class CircuitBreaker:
    """Deterministic, time-controllable circuit breaker state machine.
    
    Transitions:
    - CLOSED -> OPEN after `failure_threshold` consecutive failures.
    - OPEN -> HALF_OPEN after `recovery_timeout_seconds`.
    - HALF_OPEN -> CLOSED on successful probe.
    - HALF_OPEN -> OPEN on failed probe.
    """

    def __init__(
        self,
        config: Optional[CircuitBreakerConfig] = None,
        clock: Optional[Callable[[], datetime]] = None,
    ) -> None:
        self.config = config or CircuitBreakerConfig()
        self.clock = clock or datetime.utcnow
        self._lock = Lock()

        self._state = CircuitState.CLOSED
        self._consecutive_failures = 0
        self._last_state_change = self.clock()
        self._half_open_probe_count = 0

    @property
    def state(self) -> CircuitState:
        with self._lock:
            self._evaluate_state_transition()
            return self._state

    def allow_request(self) -> bool:
        """Evaluates whether execution requests can proceed.
        
        Raises ProviderCircuitOpenError if the breaker is OPEN.
        """
        with self._lock:
            self._evaluate_state_transition()
            if self._state == CircuitState.OPEN:
                raise ProviderCircuitOpenError(
                    f"Execution blocked: Provider circuit breaker is OPEN (opened at {self._last_state_change.isoformat()})."
                )
            if self._state == CircuitState.HALF_OPEN:
                if self._half_open_probe_count >= self.config.half_open_max_probe_calls:
                    raise ProviderCircuitOpenError(
                        "Execution blocked: Circuit breaker is HALF_OPEN and probe quota reached."
                    )
                self._half_open_probe_count += 1
            return True

    def record_success(self) -> None:
        with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.CLOSED
                self._consecutive_failures = 0
                self._half_open_probe_count = 0
                self._last_state_change = self.clock()
            elif self._state == CircuitState.CLOSED:
                self._consecutive_failures = 0

    def record_failure(self) -> None:
        with self._lock:
            self._consecutive_failures += 1
            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                self._last_state_change = self.clock()
                self._half_open_probe_count = 0
            elif self._state == CircuitState.CLOSED:
                if self._consecutive_failures >= self.config.failure_threshold:
                    self._state = CircuitState.OPEN
                    self._last_state_change = self.clock()

    def reset(self) -> None:
        with self._lock:
            self._state = CircuitState.CLOSED
            self._consecutive_failures = 0
            self._half_open_probe_count = 0
            self._last_state_change = self.clock()

    def _evaluate_state_transition(self) -> None:
        now = self.clock()
        if self._state == CircuitState.OPEN:
            elapsed = (now - self._last_state_change).total_seconds()
            if elapsed >= self.config.recovery_timeout_seconds:
                self._state = CircuitState.HALF_OPEN
                self._last_state_change = now
                self._half_open_probe_count = 0
