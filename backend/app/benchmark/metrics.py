from decimal import Decimal
from dataclasses import dataclass, field


@dataclass(frozen=True)
class BenchmarkMetrics:
    """Strongly typed aggregated benchmark metrics contract for strategy comparison.
    
    Includes explicit domain validation to prevent impossible metric states.
    """
    strategy_name: str
    total_cases: int
    recovered_cases: int
    failed_cases: int
    recovery_rate: float
    total_failed_revenue: Decimal
    total_recovered_revenue: Decimal
    recovery_revenue_percentage: float
    average_attempts_per_case: float
    execution_count: int
    policy_rejection_count: int
    stopped_cases: int
    escalated_cases: int

    def __post_init__(self) -> None:
        if self.total_cases < 0:
            raise ValueError("total_cases cannot be negative.")
        if self.recovered_cases < 0 or self.failed_cases < 0:
            raise ValueError("recovered_cases and failed_cases cannot be negative.")
        if self.recovered_cases > self.total_cases:
            raise ValueError(f"recovered_cases ({self.recovered_cases}) cannot exceed total_cases ({self.total_cases}).")
        if self.recovered_cases + self.failed_cases != self.total_cases:
            raise ValueError(f"recovered_cases ({self.recovered_cases}) + failed_cases ({self.failed_cases}) must equal total_cases ({self.total_cases}).")
        if not (0.0 <= self.recovery_rate <= 1.0):
            raise ValueError(f"recovery_rate ({self.recovery_rate}) must be between 0.0 and 1.0.")
        if self.total_failed_revenue < Decimal("0") or self.total_recovered_revenue < Decimal("0"):
            raise ValueError("Revenue metrics cannot be negative.")
        if self.total_cases > 0 and self.total_recovered_revenue > self.total_failed_revenue:
            raise ValueError(f"total_recovered_revenue ({self.total_recovered_revenue}) cannot exceed total_failed_revenue ({self.total_failed_revenue}).")
        if not (0.0 <= self.recovery_revenue_percentage <= 100.0):
            raise ValueError(f"recovery_revenue_percentage ({self.recovery_revenue_percentage}) must be between 0.0% and 100.0%.")
