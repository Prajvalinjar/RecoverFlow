from decimal import Decimal
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class FailureCode(str, Enum):
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS"
    BANK_TIMEOUT = "BANK_TIMEOUT"
    NETWORK_FAILURE = "NETWORK_FAILURE"
    CARD_DECLINED = "CARD_DECLINED"
    AUTHENTICATION_FAILURE = "AUTHENTICATION_FAILURE"
    TEMPORARY_DEGRADATION = "TEMPORARY_DEGRADATION"


@dataclass(frozen=True)
class Payment:
    payment_id: str
    customer_id: str
    amount: Decimal
    currency: str = "INR"
    status: PaymentStatus = PaymentStatus.FAILED
    failure_code: Optional[FailureCode] = None
    failure_reason: Optional[str] = None
    payment_method: str = "CARD"
    created_at: datetime = field(default_factory=datetime.now)
    attempt_number: int = 1

    def __post_init__(self) -> None:
        if self.amount <= Decimal("0"):
            raise ValueError("Payment amount must be greater than zero.")
        if self.attempt_number < 1:
            raise ValueError("Attempt number must be at least 1.")
