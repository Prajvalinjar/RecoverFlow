from decimal import Decimal
import pytest

from app.benchmark.metrics import BenchmarkMetrics


def test_metrics_calculation() -> None:
    metrics = BenchmarkMetrics(
        strategy_name="RecoverFlow",
        total_cases=100,
        recovered_cases=85,
        failed_cases=15,
        recovery_rate=0.85,
        total_failed_revenue=Decimal("100000.00"),
        total_recovered_revenue=Decimal("85000.00"),
        recovery_revenue_percentage=85.0,
        average_attempts_per_case=1.2,
        execution_count=120,
        policy_rejection_count=5,
        stopped_cases=10,
        escalated_cases=2,
    )

    assert metrics.strategy_name == "RecoverFlow"
    assert metrics.recovery_rate == 0.85
    assert metrics.recovery_revenue_percentage == 85.0


def test_metrics_validation_invalid_recovery_rate() -> None:
    with pytest.raises(ValueError) as exc_info:
        BenchmarkMetrics(
            strategy_name="Test",
            total_cases=10,
            recovered_cases=5,
            failed_cases=5,
            recovery_rate=1.5,  # > 1.0 invalid
            total_failed_revenue=Decimal("1000.00"),
            total_recovered_revenue=Decimal("500.00"),
            recovery_revenue_percentage=50.0,
            average_attempts_per_case=1.0,
            execution_count=5,
            policy_rejection_count=0,
            stopped_cases=0,
            escalated_cases=0,
        )
    assert "recovery_rate" in str(exc_info.value)


def test_metrics_validation_recovered_exceeds_total() -> None:
    with pytest.raises(ValueError) as exc_info:
        BenchmarkMetrics(
            strategy_name="Test",
            total_cases=10,
            recovered_cases=12,  # > 10 invalid
            failed_cases=-2,
            recovery_rate=0.8,
            total_failed_revenue=Decimal("1000.00"),
            total_recovered_revenue=Decimal("500.00"),
            recovery_revenue_percentage=50.0,
            average_attempts_per_case=1.0,
            execution_count=5,
            policy_rejection_count=0,
            stopped_cases=0,
            escalated_cases=0,
        )
    assert "recovered_cases" in str(exc_info.value) or "negative" in str(exc_info.value)


def test_metrics_validation_recovered_revenue_exceeds_failed() -> None:
    with pytest.raises(ValueError) as exc_info:
        BenchmarkMetrics(
            strategy_name="Test",
            total_cases=10,
            recovered_cases=5,
            failed_cases=5,
            recovery_rate=0.5,
            total_failed_revenue=Decimal("1000.00"),
            total_recovered_revenue=Decimal("1500.00"),  # > 1000 invalid
            recovery_revenue_percentage=150.0,
            average_attempts_per_case=1.0,
            execution_count=5,
            policy_rejection_count=0,
            stopped_cases=0,
            escalated_cases=0,
        )
    assert "total_recovered_revenue" in str(exc_info.value) or "recovery_revenue_percentage" in str(exc_info.value)


def test_metrics_validation_negative_revenue() -> None:
    with pytest.raises(ValueError) as exc_info:
        BenchmarkMetrics(
            strategy_name="Test",
            total_cases=10,
            recovered_cases=5,
            failed_cases=5,
            recovery_rate=0.5,
            total_failed_revenue=Decimal("-100.00"),  # Negative
            total_recovered_revenue=Decimal("0.00"),
            recovery_revenue_percentage=0.0,
            average_attempts_per_case=1.0,
            execution_count=5,
            policy_rejection_count=0,
            stopped_cases=0,
            escalated_cases=0,
        )
    assert "Revenue metrics cannot be negative" in str(exc_info.value)


def test_zero_case_metrics() -> None:
    metrics = BenchmarkMetrics(
        strategy_name="Zero",
        total_cases=0,
        recovered_cases=0,
        failed_cases=0,
        recovery_rate=0.0,
        total_failed_revenue=Decimal("0.00"),
        total_recovered_revenue=Decimal("0.00"),
        recovery_revenue_percentage=0.0,
        average_attempts_per_case=0.0,
        execution_count=0,
        policy_rejection_count=0,
        stopped_cases=0,
        escalated_cases=0,
    )
    assert metrics.total_cases == 0
    assert metrics.recovery_rate == 0.0
