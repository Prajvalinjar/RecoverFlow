from typing import Dict
from threading import Lock


class MetricsRegistry:
    """Lightweight in-memory operational telemetry metrics registry."""

    _instance = None
    _lock = Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(MetricsRegistry, cls).__new__(cls)
                cls._instance._counters = {
                    "payment_events_received": 0,
                    "payment_events_duplicate": 0,
                    "recovery_jobs_created": 0,
                    "recovery_jobs_completed": 0,
                    "recovery_jobs_failed": 0,
                    "recovery_jobs_retried": 0,
                    "recovery_jobs_dead_lettered": 0,
                    "executions_dispatched": 0,
                    "executions_completed": 0,
                    "executions_failed": 0,
                    "executions_duplicate": 0,
                    "policy_rejections": 0,
                    "recoveries_completed": 0,
                }
            return cls._instance

    def increment(self, name: str, value: int = 1) -> None:
        with self._lock:
            if name in self._counters:
                self._counters[name] += value
            else:
                self._counters[name] = value

    def get_counter(self, name: str) -> int:
        with self._lock:
            return self._counters.get(name, 0)

    def get_all(self) -> Dict[str, int]:
        with self._lock:
            return dict(self._counters)

    def reset(self) -> None:
        with self._lock:
            for k in self._counters:
                self._counters[k] = 0


metrics_registry = MetricsRegistry()
