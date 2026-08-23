import pytest
from app.observability.telemetry import TelemetryRegistry


def test_telemetry_counter_increment() -> None:
    registry = TelemetryRegistry()
    registry.reset()

    registry.increment_counter("events_received", 1.0, {"event_type": "payment.failed"})
    registry.increment_counter("events_received", 2.0, {"event_type": "payment.failed"})

    snap = registry.snapshot()
    assert snap["counters"]["events_received{event_type=payment.failed}"] == 3.0


def test_telemetry_gauge_set() -> None:
    registry = TelemetryRegistry()
    registry.reset()

    registry.set_gauge("active_jobs", 5.0)
    registry.set_gauge("active_jobs", 3.0)

    snap = registry.snapshot()
    assert snap["gauges"]["active_jobs"] == 3.0


def test_telemetry_histogram_observe() -> None:
    registry = TelemetryRegistry()
    registry.reset()

    registry.observe_histogram("latency_ms", 12.5)
    registry.observe_histogram("latency_ms", 15.0)

    snap = registry.snapshot()
    assert snap["histograms"]["latency_ms"] == [12.5, 15.0]


def test_telemetry_reset_for_test_isolation() -> None:
    registry = TelemetryRegistry()
    registry.increment_counter("test_counter")
    assert len(registry.snapshot()["counters"]) > 0

    registry.reset()
    assert len(registry.snapshot()["counters"]) == 0
