import random
from decimal import Decimal
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.domain.payment import PaymentStatus, FailureCode
from app.domain.recovery_case import CaseState, CasePriority
from app.data.models import (
    CustomerSegment,
    SyntheticCustomer,
    SyntheticPayment,
    SyntheticRecoveryCase,
    SyntheticRecoveryAttempt,
    SyntheticDataset,
)


class SyntheticDataGenerator:
    """Deterministic, isolated-RNG synthetic data generator for fintech payment recovery benchmarking.
    
    Responsibilities:
    - Generates realistic, coherent customer behavioral profiles and payment histories.
    - Uses an isolated `random.Random(seed)` instance to prevent global random state mutation.
    - Guarantees 100% reproducible output for identical seeds and configuration.
    """

    def __init__(
        self,
        seed: int = 20260822,
        customer_count: int = 100,
        payments_per_customer: int = 10,
        failed_payment_ratio: float = 0.15,
    ) -> None:
        self.seed = seed
        self.customer_count = customer_count
        self.payments_per_customer = payments_per_customer
        self.failed_payment_ratio = failed_payment_ratio
        self._rng = random.Random(seed)

    def generate(self) -> SyntheticDataset:
        """Generates a complete, validated synthetic dataset deterministically."""
        # Re-initialize isolated RNG to guarantee exact reproducibility per call
        self._rng = random.Random(self.seed)

        customers: List[SyntheticCustomer] = []
        payments: List[SyntheticPayment] = []
        recovery_cases: List[SyntheticRecoveryCase] = []

        segments = [
            (CustomerSegment.PREMIUM, 0.15),
            (CustomerSegment.HIGH_VALUE, 0.15),
            (CustomerSegment.REGULAR, 0.40),
            (CustomerSegment.AT_RISK, 0.15),
            (CustomerSegment.NEW, 0.15),
        ]

        # 1. Generate Customers
        for i in range(1, self.customer_count + 1):
            customer_id = f"cust_synth_{i:04d}"
            segment = self._weighted_choice(segments)
            customer = self._generate_customer(customer_id, segment)
            customers.append(customer)

        # 2. Generate Payments and Recovery Cases
        base_time = datetime(2026, 8, 1, 10, 0, 0)
        failure_codes = [
            (FailureCode.BANK_TIMEOUT, 0.30),
            (FailureCode.NETWORK_FAILURE, 0.20),
            (FailureCode.INSUFFICIENT_FUNDS, 0.25),
            (FailureCode.CARD_DECLINED, 0.15),
            (FailureCode.AUTHENTICATION_FAILURE, 0.10),
        ]

        payment_counter = 1
        case_counter = 1

        for customer in customers:
            # Determine payment volume for this customer based on segment
            if customer.segment == CustomerSegment.NEW:
                num_payments = self._rng.randint(1, 2)
            else:
                num_payments = max(1, int(self.payments_per_customer * self._rng.uniform(0.7, 1.3)))

            for p_idx in range(num_payments):
                payment_id = f"pay_synth_{payment_counter:06d}"
                payment_counter += 1

                # Generate amount based on segment
                amount = self._generate_amount(customer.segment)

                # Determine if this payment fails
                is_failed = self._determine_payment_failure(customer)
                created_at = base_time + timedelta(hours=p_idx * 12 + self._rng.randint(0, 10))

                if not is_failed:
                    p = SyntheticPayment(
                        payment_id=payment_id,
                        customer_id=customer.customer_id,
                        amount=amount,
                        status=PaymentStatus.SUCCESS,
                        failure_code=None,
                        failure_reason=None,
                        attempt_number=1,
                        payment_method=customer.payment_method_preference,
                        created_at=created_at,
                    )
                    payments.append(p)
                else:
                    failure_code = self._weighted_choice(failure_codes)
                    failure_reason = f"Simulated failure: {failure_code.value}"
                    p = SyntheticPayment(
                        payment_id=payment_id,
                        customer_id=customer.customer_id,
                        amount=amount,
                        status=PaymentStatus.FAILED,
                        failure_code=failure_code,
                        failure_reason=failure_reason,
                        attempt_number=1,
                        payment_method=customer.payment_method_preference,
                        created_at=created_at,
                    )
                    payments.append(p)

                    # Create a RecoveryCase for failed payments
                    case_id = f"case_synth_{case_counter:06d}"
                    case_counter += 1
                    priority = CasePriority.HIGH if amount > Decimal("20000.00") else CasePriority.MEDIUM

                    case = SyntheticRecoveryCase(
                        case_id=case_id,
                        payment_id=payment_id,
                        customer_id=customer.customer_id,
                        amount=amount,
                        failure_code=failure_code,
                        state=CaseState.DETECTED,
                        priority=priority,
                        attempts_count=0,
                        max_allowed_attempts=3,
                        detected_at=created_at + timedelta(minutes=5),
                    )
                    recovery_cases.append(case)

        dataset = SyntheticDataset(
            seed=self.seed,
            customers=customers,
            payments=payments,
            recovery_cases=recovery_cases,
            recovery_attempts=[],
        )
        return dataset

    def _generate_customer(self, customer_id: str, segment: CustomerSegment) -> SyntheticCustomer:
        if segment == CustomerSegment.NEW:
            hist_success = self._rng.randint(0, 1)
            hist_fail = self._rng.randint(0, 1)
            hist_total = hist_success + hist_fail
            avg_delay = float(self._rng.uniform(0.0, 12.0))
            prev_attempts = 0
            prev_successes = 0
            total_spent = Decimal(str(round(self._rng.uniform(500.0, 5000.0), 2)))
        elif segment == CustomerSegment.PREMIUM:
            hist_total = self._rng.randint(20, 50)
            hist_success = int(hist_total * self._rng.uniform(0.90, 0.98))
            hist_fail = hist_total - hist_success
            avg_delay = float(self._rng.uniform(1.0, 6.0))
            prev_attempts = self._rng.randint(1, 5)
            prev_successes = int(prev_attempts * 0.9)
            total_spent = Decimal(str(round(self._rng.uniform(50000.0, 250000.0), 2)))
        elif segment == CustomerSegment.HIGH_VALUE:
            hist_total = self._rng.randint(15, 40)
            hist_success = int(hist_total * self._rng.uniform(0.85, 0.95))
            hist_fail = hist_total - hist_success
            avg_delay = float(self._rng.uniform(2.0, 10.0))
            prev_attempts = self._rng.randint(1, 4)
            prev_successes = int(prev_attempts * 0.8)
            total_spent = Decimal(str(round(self._rng.uniform(40000.0, 150000.0), 2)))
        elif segment == CustomerSegment.AT_RISK:
            hist_total = self._rng.randint(10, 30)
            hist_success = int(hist_total * self._rng.uniform(0.20, 0.50))
            hist_fail = hist_total - hist_success
            avg_delay = float(self._rng.uniform(12.0, 48.0))
            prev_attempts = self._rng.randint(3, 8)
            prev_successes = int(prev_attempts * 0.2)
            total_spent = Decimal(str(round(self._rng.uniform(2000.0, 15000.0), 2)))
        else:  # REGULAR
            hist_total = self._rng.randint(10, 25)
            hist_success = int(hist_total * self._rng.uniform(0.75, 0.90))
            hist_fail = hist_total - hist_success
            avg_delay = float(self._rng.uniform(4.0, 18.0))
            prev_attempts = self._rng.randint(1, 3)
            prev_successes = int(prev_attempts * 0.7)
            total_spent = Decimal(str(round(self._rng.uniform(10000.0, 50000.0), 2)))

        payment_method = self._rng.choice(["CARD", "UPI", "NETBANKING", "WALLET"])

        return SyntheticCustomer(
            customer_id=customer_id,
            segment=segment,
            historical_payment_count=hist_total,
            historical_success_count=hist_success,
            historical_failure_count=hist_fail,
            average_payment_delay=avg_delay,
            previous_recovery_attempts=prev_attempts,
            previous_recovery_successes=prev_successes,
            total_spent=total_spent,
            payment_method_preference=payment_method,
        )

    def _generate_amount(self, segment: CustomerSegment) -> Decimal:
        if segment == CustomerSegment.PREMIUM:
            val = self._rng.uniform(5000.0, 50000.0)
        elif segment == CustomerSegment.HIGH_VALUE:
            val = self._rng.uniform(20000.0, 120000.0)
        elif segment == CustomerSegment.AT_RISK:
            val = self._rng.uniform(1000.0, 15000.0)
        elif segment == CustomerSegment.NEW:
            val = self._rng.uniform(500.0, 5000.0)
        else:  # REGULAR
            val = self._rng.uniform(1000.0, 10000.0)

        # Round to 2 decimal places cleanly
        return Decimal(str(round(val, 2)))

    def _determine_payment_failure(self, customer: SyntheticCustomer) -> bool:
        # Base probability from ratio
        base_fail_prob = self.failed_payment_ratio

        if customer.segment == CustomerSegment.AT_RISK:
            fail_prob = min(0.60, base_fail_prob * 2.5)
        elif customer.segment == CustomerSegment.PREMIUM:
            fail_prob = max(0.03, base_fail_prob * 0.4)
        elif customer.segment == CustomerSegment.HIGH_VALUE:
            fail_prob = max(0.05, base_fail_prob * 0.6)
        elif customer.segment == CustomerSegment.NEW:
            fail_prob = base_fail_prob * 1.1
        else:
            fail_prob = base_fail_prob

        return self._rng.random() < fail_prob

    def _weighted_choice(self, choices: List[tuple]) -> any:
        total = sum(weight for _, weight in choices)
        r = self._rng.uniform(0, total)
        upto = 0.0
        for item, weight in choices:
            if upto + weight >= r:
                return item
            upto += weight
        return choices[-1][0]
