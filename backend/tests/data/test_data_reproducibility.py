import pytest
from app.data.generator import SyntheticDataGenerator


def test_same_seed_produces_identical_dataset() -> None:
    gen1 = SyntheticDataGenerator(seed=20260822, customer_count=30)
    dataset1 = gen1.generate()

    gen2 = SyntheticDataGenerator(seed=20260822, customer_count=30)
    dataset2 = gen2.generate()

    assert len(dataset1.customers) == len(dataset2.customers)
    assert len(dataset1.payments) == len(dataset2.payments)
    assert len(dataset1.recovery_cases) == len(dataset2.recovery_cases)
    assert dataset1.total_failed_amount == dataset2.total_failed_amount

    for c1, c2 in zip(dataset1.customers, dataset2.customers):
        assert c1.customer_id == c2.customer_id
        assert c1.segment == c2.segment
        assert c1.total_spent == c2.total_spent

    for case1, case2 in zip(dataset1.recovery_cases, dataset2.recovery_cases):
        assert case1.case_id == case2.case_id
        assert case1.amount == case2.amount
        assert case1.failure_code == case2.failure_code


def test_different_seed_produces_different_dataset() -> None:
    gen1 = SyntheticDataGenerator(seed=11111, customer_count=20)
    dataset1 = gen1.generate()

    gen2 = SyntheticDataGenerator(seed=99999, customer_count=20)
    dataset2 = gen2.generate()

    assert dataset1.seed != dataset2.seed
    # Amounts or failure counts should differ between different seeds
    amounts1 = [c.total_spent for c in dataset1.customers]
    amounts2 = [c.total_spent for c in dataset2.customers]
    assert amounts1 != amounts2
