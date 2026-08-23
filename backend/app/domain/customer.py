from decimal import Decimal
from dataclasses import dataclass


@dataclass(frozen=True)
class CustomerContext:
    customer_id: str
    historical_success_count: int = 0
    historical_failure_count: int = 0
    average_payment_delay_hours: float = 0.0
    previous_recovery_success_rate: float = 0.0  # Range: 0.0 to 1.0
    customer_segment: str = "STANDARD"
    total_spent: Decimal = Decimal("0.00")

    def __post_init__(self) -> None:
        if self.historical_success_count < 0:
            raise ValueError("historical_success_count cannot be negative.")
        if self.historical_failure_count < 0:
            raise ValueError("historical_failure_count cannot be negative.")
        if not (0.0 <= self.previous_recovery_success_rate <= 1.0):
            raise ValueError("previous_recovery_success_rate must be between 0.0 and 1.0.")
