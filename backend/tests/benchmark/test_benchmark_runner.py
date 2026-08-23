from decimal import Decimal
import pytest

from app.data.generator import SyntheticDataGenerator
from app.benchmark.runner import BenchmarkRunner


def test_benchmark_runner_executes_all_strategies() -> None:
    generator = SyntheticDataGenerator(seed=20260822, customer_count=20)
    dataset = generator.generate()

    runner = BenchmarkRunner()
    results = runner.run(dataset)

    assert "No Recovery" in results
    assert "Blind Retry" in results
    assert "Repeated Retry" in results
    assert "RecoverFlow" in results

    no_rec = results["No Recovery"]
    blind = results["Blind Retry"]
    repeated = results["Repeated Retry"]
    rf = results["RecoverFlow"]

    assert no_rec.recovery_rate == 0.0
    assert blind.total_cases == len(dataset.recovery_cases)
    assert repeated.total_cases == len(dataset.recovery_cases)
    assert rf.total_cases == len(dataset.recovery_cases)


def test_benchmark_runner_strategy_isolation() -> None:
    generator = SyntheticDataGenerator(seed=20260822, customer_count=15)
    dataset = generator.generate()

    runner = BenchmarkRunner()
    results = runner.run(dataset)

    # Strategy 1 (No Recovery) should have 0 executions
    assert results["No Recovery"].execution_count == 0
    # Strategy 4 (RecoverFlow) should have non-zero executions
    assert results["RecoverFlow"].execution_count > 0


def test_benchmark_runner_prevents_dataset_mutation() -> None:
    generator = SyntheticDataGenerator(seed=20260822, customer_count=10)
    dataset = generator.generate()

    initial_failed_amount = dataset.total_failed_amount
    initial_case_states = [c.state for c in dataset.recovery_cases]

    runner = BenchmarkRunner()
    runner.run(dataset)

    # Dataset state and cases should remain unmutated after benchmark execution
    assert dataset.total_failed_amount == initial_failed_amount
    current_case_states = [c.state for c in dataset.recovery_cases]
    assert current_case_states == initial_case_states
