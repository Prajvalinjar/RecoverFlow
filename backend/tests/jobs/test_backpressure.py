from app.jobs.backpressure import BackpressureController, BackpressureLevel, BackpressureThresholds


def test_backpressure_controller_level_evaluation() -> None:
    ctrl = BackpressureController(BackpressureThresholds(elevated_depth=50, high_depth=150, critical_depth=300))

    assert ctrl.evaluate(10) == BackpressureLevel.NORMAL
    assert ctrl.evaluate(60) == BackpressureLevel.ELEVATED
    assert ctrl.evaluate(200) == BackpressureLevel.HIGH
    assert ctrl.evaluate(400) == BackpressureLevel.CRITICAL


def test_backpressure_controller_enqueue_decisions() -> None:
    ctrl = BackpressureController()

    # Normal queue depth
    can_enq, _ = ctrl.can_enqueue(priority="LOW", queued_depth=10)
    assert can_enq is True

    # Critical queue depth -> reject LOW, accept HIGH
    can_enq_low, reason_low = ctrl.can_enqueue(priority="LOW", queued_depth=400)
    assert can_enq_low is False
    assert "CRITICAL" in reason_low

    can_enq_high, reason_high = ctrl.can_enqueue(priority="HIGH", queued_depth=400)
    assert can_enq_high is True
