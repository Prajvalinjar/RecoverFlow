from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional
from threading import Lock


class ProviderHealthStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNAVAILABLE = "UNAVAILABLE"
    UNKNOWN = "UNKNOWN"


@dataclass
class ProviderHealth:
    provider_name: str
    status: ProviderHealthStatus = ProviderHealthStatus.HEALTHY
    consecutive_successes: int = 0
    consecutive_failures: int = 0
    last_success_at: Optional[datetime] = None
    last_failure_at: Optional[datetime] = None
    last_error: Optional[str] = None
    checked_at: datetime = field(default_factory=datetime.utcnow)


class ProviderHealthMonitor:
    """Deterministic provider health tracking monitor."""

    _instance = None
    _lock = Lock()

    def __new__(cls, failure_threshold: int = 3, degradation_threshold: int = 2):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ProviderHealthMonitor, cls).__new__(cls)
                cls._instance._health_map: Dict[str, ProviderHealth] = {}
                cls._instance.failure_threshold = failure_threshold
                cls._instance.degradation_threshold = degradation_threshold
            return cls._instance

    def record_success(self, provider_name: str) -> ProviderHealth:
        with self._lock:
            health = self._get_or_create(provider_name)
            health.consecutive_successes += 1
            health.consecutive_failures = 0
            health.last_success_at = datetime.utcnow()
            health.checked_at = datetime.utcnow()
            health.status = ProviderHealthStatus.HEALTHY
            return health

    def record_failure(self, provider_name: str, error_message: str) -> ProviderHealth:
        with self._lock:
            health = self._get_or_create(provider_name)
            health.consecutive_failures += 1
            health.consecutive_successes = 0
            health.last_failure_at = datetime.utcnow()
            health.last_error = error_message
            health.checked_at = datetime.utcnow()

            if health.consecutive_failures >= self.failure_threshold:
                health.status = ProviderHealthStatus.UNAVAILABLE
            elif health.consecutive_failures >= self.degradation_threshold:
                health.status = ProviderHealthStatus.DEGRADED
            return health

    def get_health(self, provider_name: str) -> ProviderHealth:
        with self._lock:
            return self._get_or_create(provider_name)

    def reset(self) -> None:
        with self._lock:
            self._health_map.clear()

    def _get_or_create(self, provider_name: str) -> ProviderHealth:
        if provider_name not in self._health_map:
            self._health_map[provider_name] = ProviderHealth(provider_name=provider_name)
        return self._health_map[provider_name]
