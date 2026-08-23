from enum import Enum
from typing import Tuple, Dict, Any
from dataclasses import dataclass
from app.observability.telemetry import telemetry_registry


class BackpressureLevel(str, Enum):
    NORMAL = "NORMAL"
    ELEVATED = "ELEVATED"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class BackpressureThresholds:
    elevated_depth: int = 50
    high_depth: int = 150
    critical_depth: int = 300


class BackpressureController:
    """Deterministic backpressure and queue capacity controller.

    Guarantees queue protection without silently dropping recovery jobs.
    """

    def __init__(self, thresholds: Optional[BackpressureThresholds] = None) -> None:
        self.thresholds = thresholds or BackpressureThresholds()

    def evaluate(self, queued_depth: int) -> BackpressureLevel:
        if queued_depth >= self.thresholds.critical_depth:
            level = BackpressureLevel.CRITICAL
        elif queued_depth >= self.thresholds.high_depth:
            level = BackpressureLevel.HIGH
        elif queued_depth >= self.thresholds.elevated_depth:
            level = BackpressureLevel.ELEVATED
        else:
            level = BackpressureLevel.NORMAL

        telemetry_registry.set_gauge("queue.backpressure_level", self._level_to_numeric(level))
        return level

    def _level_to_numeric(self, level: BackpressureLevel) -> float:
        mapping = {
            BackpressureLevel.NORMAL: 0.0,
            BackpressureLevel.ELEVATED: 1.0,
            BackpressureLevel.HIGH: 2.0,
            BackpressureLevel.CRITICAL: 3.0,
        }
        return mapping.get(level, 0.0)

    def can_enqueue(self, priority: str = "NORMAL", queued_depth: int = 0) -> Tuple[bool, str]:
        level = self.evaluate(queued_depth)
        p_str = priority.upper()

        if level == BackpressureLevel.CRITICAL:
            if p_str in ("CRITICAL", "HIGH"):
                return True, "Enqueued under CRITICAL backpressure for high-priority job"
            telemetry_registry.increment("jobs.backpressure_rejected")
            return False, "Queue capacity CRITICAL. Non-essential job deferred."

        if level == BackpressureLevel.HIGH:
            if p_str == "LOW":
                telemetry_registry.increment("jobs.backpressure_deferred")
                return False, "Queue capacity HIGH. Low-priority job deferred."

        return True, "Enqueued normally"

    def can_claim(self, queued_depth: int = 0) -> bool:
        """Workers can always claim existing queued jobs unless global pause is active."""
        return True

    def recommended_delay_seconds(self, queued_depth: int = 0) -> float:
        level = self.evaluate(queued_depth)
        delays = {
            BackpressureLevel.NORMAL: 0.0,
            BackpressureLevel.ELEVATED: 1.0,
            BackpressureLevel.HIGH: 5.0,
            BackpressureLevel.CRITICAL: 15.0,
        }
        return delays.get(level, 0.0)
