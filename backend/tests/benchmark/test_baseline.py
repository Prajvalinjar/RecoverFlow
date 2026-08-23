from decimal import Decimal
import pytest

from app.data.scenarios import BenchmarkScenarioLibrary
from app.simulation.executor import SimulatedRecoveryExecutor
from app.benchmark.baseline import (
    NoRecoveryBaseline,
    BlindRetryBaseline,
    RepeatedRetryBaseline,
    RecoverFlowStrategy,
)


def test_no_recovery_baseline() -> None:
    cust, pay, case = BenchmarkScenarioLibrary.scenario_a_high_recovery_potential()
    strategy = NoRecoveryBaseline()

    res = strategy.run_case(cust, pay, case)

    assert res.strategy_name == "No Recovery"
    assert res.is_recovered is False
    assert res.amount_recovered == Decimal("0.00")
    assert res.attempts_count == 0
    assert res.execution_count == 0


def test_blind_retry_baseline() -> None:
    cust, pay, case = BenchmarkScenarioLibrary.scenario_a_high_recovery_potential()
    strategy = BlindRetryBaseline()
    executor = SimulatedRecoveryExecutor()

    res = strategy.run_case(cust, pay, case, executor=executor)

    assert res.strategy_name == "Blind Retry"
    assert res.execution_count == 1
    assert res.attempts_count == 1
    assert res.is_recovered is True
    assert res.amount_recovered == pay.amount


def test_repeated_retry_baseline() -> None:
    cust, pay, case = BenchmarkScenarioLibrary.scenario_b_multi_step_retry_failed()
    strategy = RepeatedRetryBaseline()
    executor = SimulatedRecoveryExecutor()

    res = strategy.run_case(cust, pay, case, executor=executor)

    assert res.strategy_name == "Repeated Retry"
    assert res.execution_count >= 1
    assert res.attempts_count >= 1


def test_recoverflow_baseline_uses_existing_pipeline() -> None:
    cust, pay, case = BenchmarkScenarioLibrary.scenario_a_high_recovery_potential()
    strategy = RecoverFlowStrategy()
    executor = SimulatedRecoveryExecutor()

    res = strategy.run_case(cust, pay, case, executor=executor)

    assert res.strategy_name == "RecoverFlow"
    assert res.is_recovered is True
    assert res.amount_recovered == pay.amount
    assert res.execution_count == 1
