from decimal import Decimal
from enum import Enum
from typing import List, Optional
from dataclasses import dataclass, field
from datetime import datetime

from app.domain.customer import CustomerContext
from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.recovery_case import RecoveryCase, CaseState, CasePriority
from app.domain.actions import ActionType
from app.domain.outcome import OutcomeStatus


class CustomerSegment(str, Enum):
    NEW = "NEW"
    REGULAR = "REGULAR"
    HIGH_VALUE = "HIGH_VALUE"
    PREMIUM = "PREMIUM"
    AT_RISK = "AT_RISK"


@dataclass
class SyntheticCustomer:
    """Synthetic customer data model representing historical behavioral context."""
    customer_id: str
    segment: CustomerSegment
    historical_payment_count: int = 0
    historical_success_count: int = 0
    historical_failure_count: int = 0
    average_payment_delay: float = 0.0
    previous_recovery_attempts: int = 0
    previous_recovery_successes: int = 0
    total_spent: Decimal = Decimal("0.00")
    payment_method_preference: str = "CARD"

    def __post_init__(self) -> None:
        if self.historical_payment_count < 0:
            raise ValueError("historical_payment_count cannot be negative.")
        if self.historical_success_count < 0:
            raise ValueError("historical_success_count cannot be negative.")
        if self.historical_failure_count < 0:
            raise ValueError("historical_failure_count cannot be negative.")
        if self.historical_success_count + self.historical_failure_count > self.historical_payment_count:
            # Adjust historical_payment_count if sum exceeds it
            self.historical_payment_count = self.historical_success_count + self.historical_failure_count
        if self.total_spent < Decimal("0"):
            raise ValueError("total_spent cannot be negative.")

    @property
    def historical_success_rate(self) -> float:
        total = self.historical_success_count + self.historical_failure_count
        if total == 0:
            return 0.0
        return float(self.historical_success_count / total)

    @property
    def previous_recovery_success_rate(self) -> float:
        if self.previous_recovery_attempts == 0:
            return 0.0
        return float(self.previous_recovery_successes / self.previous_recovery_attempts)

    def to_domain_customer_context(self) -> CustomerContext:
        """Converts to existing Phase 1A CustomerContext domain model."""
        return CustomerContext(
            customer_id=self.customer_id,
            historical_success_count=self.historical_success_count,
            historical_failure_count=self.historical_failure_count,
            average_payment_delay_hours=self.average_payment_delay,
            previous_recovery_success_rate=self.previous_recovery_success_rate,
            customer_segment=self.segment.value,
            total_spent=self.total_spent,
        )


@dataclass
class SyntheticPayment:
    """Synthetic payment data model representing historical or failed transactions."""
    payment_id: str
    customer_id: str
    amount: Decimal
    currency: str = "INR"
    status: PaymentStatus = PaymentStatus.FAILED
    failure_code: Optional[FailureCode] = None
    failure_reason: Optional[str] = None
    attempt_number: int = 1
    payment_method: str = "CARD"
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        if self.amount <= Decimal("0"):
            raise ValueError("Payment amount must be greater than zero.")
        if self.attempt_number < 1:
            raise ValueError("Attempt number must be at least 1.")

    def to_domain_payment(self) -> Payment:
        """Converts to existing Phase 1A Payment domain model."""
        return Payment(
            payment_id=self.payment_id,
            customer_id=self.customer_id,
            amount=self.amount,
            currency=self.currency,
            status=self.status,
            failure_code=self.failure_code,
            failure_reason=self.failure_reason,
            payment_method=self.payment_method,
            created_at=self.created_at,
            attempt_number=self.attempt_number,
        )


@dataclass
class SyntheticRecoveryAttempt:
    """Synthetic record of an executed recovery intervention."""
    attempt_id: str
    case_id: str
    payment_id: str
    customer_id: str
    attempt_number: int
    action_type: ActionType
    outcome_status: OutcomeStatus
    amount_recovered: Decimal = Decimal("0.00")
    executed_at: datetime = field(default_factory=datetime.now)
    failure_reason: Optional[str] = None

    def __post_init__(self) -> None:
        if self.amount_recovered < Decimal("0"):
            raise ValueError("amount_recovered cannot be negative.")


@dataclass
class SyntheticRecoveryCase:
    """Synthetic recovery case representing a failed payment being processed."""
    case_id: str
    payment_id: str
    customer_id: str
    amount: Decimal
    failure_code: Optional[FailureCode] = None
    state: CaseState = CaseState.DETECTED
    priority: CasePriority = CasePriority.MEDIUM
    attempts_count: int = 0
    max_allowed_attempts: int = 3
    detected_at: datetime = field(default_factory=datetime.now)
    last_attempt_at: Optional[datetime] = None

    def __post_init__(self) -> None:
        if self.amount <= Decimal("0"):
            raise ValueError("Case amount must be greater than zero.")
        if self.attempts_count < 0:
            raise ValueError("attempts_count cannot be negative.")

    def to_domain_recovery_case(self) -> RecoveryCase:
        """Converts to existing Phase 1A RecoveryCase domain model."""
        return RecoveryCase(
            case_id=self.case_id,
            payment_id=self.payment_id,
            customer_id=self.customer_id,
            amount_at_risk=self.amount,
            state=self.state,
            priority=self.priority,
            detected_at=self.detected_at,
            attempts_count=self.attempts_count,
            max_allowed_attempts=self.max_allowed_attempts,
            last_attempt_at=self.last_attempt_at,
        )


@dataclass
class SyntheticDataset:
    """Validated container holding a generated population of synthetic fintech data."""
    seed: int
    customers: List[SyntheticCustomer] = field(default_factory=list)
    payments: List[SyntheticPayment] = field(default_factory=list)
    recovery_cases: List[SyntheticRecoveryCase] = field(default_factory=list)
    recovery_attempts: List[SyntheticRecoveryAttempt] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.validate()

    def validate(self) -> None:
        """Validates relational integrity and metrics domain constraints."""
        customer_ids = {c.customer_id for c in self.customers}
        payment_ids = {p.payment_id for p in self.payments}

        for c in self.customers:
            if not (0.0 <= c.historical_success_rate <= 1.0):
                raise ValueError(f"Invalid historical_success_rate {c.historical_success_rate} for customer {c.customer_id}")

        for p in self.payments:
            if p.customer_id not in customer_ids:
                raise ValueError(f"Orphaned payment {p.payment_id}: customer_id {p.customer_id} not found.")

        for case in self.recovery_cases:
            if case.customer_id not in customer_ids:
                raise ValueError(f"Orphaned case {case.case_id}: customer_id {case.customer_id} not found.")
            if case.payment_id not in payment_ids:
                raise ValueError(f"Orphaned case {case.case_id}: payment_id {case.payment_id} not found.")

        if len(self.recovery_cases) > len(self.payments):
            raise ValueError(f"Invalid dataset: recovery_cases count ({len(self.recovery_cases)}) exceeds total payments ({len(self.payments)}).")

    @property
    def total_failed_amount(self) -> Decimal:
        return sum((case.amount for case in self.recovery_cases), Decimal("0.00"))
