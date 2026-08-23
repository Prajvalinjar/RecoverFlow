from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, List, Optional
from threading import Lock


class MetricType(str, Enum):
    COUNTER = "COUNTER"
    GAUGE = "GAUGE"
    HISTOGRAM = "HISTOGRAM"


@dataclass(frozen=True)
class TelemetryMetric:
    name: str
    metric_type: MetricType
    value: float
    labels: Dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)


class TelemetryRegistry:
    """Thread-safe, dependency-light, in-memory telemetry registry.
    
    Provides deterministic counters, gauges, histogram observations, snapshotting, and test resets.
    """

    _instance = None
    _lock = Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(TelemetryRegistry, cls).__new__(cls)
                cls._instance._counters: Dict[str, float] = {}
                cls._instance._gauges: Dict[str, float] = {}
                cls._instance._histograms: Dict[str, List[float]] = {}
            return cls._instance

    def increment_counter(self, name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None) -> None:
        with self._lock:
            key = self._format_key(name, labels)
            self._counters[key] = self._counters.get(key, 0.0) + value

    def increment(self, name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None) -> None:
        self.increment_counter(name, value, labels)

    def set_gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        with self._lock:
            key = self._format_key(name, labels)
            self._gauges[key] = value

    def observe_histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        with self._lock:
            key = self._format_key(name, labels)
            if key not in self._histograms:
                self._histograms[key] = []
            self._histograms[key].append(value)

    def histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        self.observe_histogram(name, value, labels)

    def snapshot(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "counters": dict(self._counters),
                "gauges": dict(self._gauges),
                "histograms": {k: list(v) for k, v in self._histograms.items()},
            }

    def reset(self) -> None:
        with self._lock:
            self._counters.clear()
            self._gauges.clear()
            self._histograms.clear()

    def _format_key(self, name: str, labels: Optional[Dict[str, str]]) -> str:
        if not labels:
            return name
        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}{{{label_str}}}"


telemetry_registry = TelemetryRegistry()
