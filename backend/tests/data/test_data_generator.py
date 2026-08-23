import random
from decimal import Decimal
import pytest

from app.data.models import CustomerSegment
from app.data.generator import SyntheticDataGenerator


def test_generator_creates_requested_population() -> None:
    generator = SyntheticDataGenerator(seed=20260822, customer_count=50, payments_per_customer=5)
    dataset = generator.generate()

    assert len(dataset.customers) == 50
    assert len(dataset.payments) > 0
    assert len(dataset.recovery_cases) > 0
    assert dataset.total_failed_amount > Decimal("0.00")


def test_generator_creates_coherent_customer_history() -> None:
    generator = SyntheticDataGenerator(seed=20260822, customer_count=50)
    dataset = generator.generate()

    for c in dataset.customers:
        assert c.historical_payment_count >= c.historical_success_count + c.historical_failure_count
        assert 0.0 <= c.historical_success_rate <= 1.0
        if c.segment == CustomerSegment.PREMIUM:
            assert c.historical_success_rate >= 0.85
        elif c.segment == CustomerSegment.AT_RISK:
            assert c.historical_success_rate <= 0.60


def test_generator_creates_failed_payment_cases() -> None:
    generator = SyntheticDataGenerator(seed=20260822, customer_count=30, failed_payment_ratio=0.30)
    dataset = generator.generate()

    failed_payments = [p for p in dataset.payments if p.status.value == "FAILED"]
    assert len(failed_payments) == len(dataset.recovery_cases)

    for case in dataset.recovery_cases:
        matching_payment = next((p for p in dataset.payments if p.payment_id == case.payment_id), None)
        assert matching_payment is not None
        assert matching_payment.customer_id == case.customer_id
        assert case.amount == matching_payment.amount


def test_generator_does_not_mutate_global_random_state() -> None:
    # Set global random state
    random.seed(99999)
    val_before = random.random()

    # Reset global seed
    random.seed(99999)

    # Run generator
    generator = SyntheticDataGenerator(seed=12345)
    generator.generate()

    # Check global random state is unaffected
    random.seed(99999)
    expected_val = random.random()

    random.seed(99999)
    generator.generate()
    actual_val = random.random()

    assert actual_val == expected_val
