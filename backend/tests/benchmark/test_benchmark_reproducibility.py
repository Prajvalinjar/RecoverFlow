import pytest

from app.data.generator import SyntheticDataGenerator
from app.benchmark.runner import BenchmarkRunner
from app.benchmark.baseline import RecoverFlowStrategy
from app.domain.orchestrator import RecoveryOrchestrator, PolicyApprovalRequiredError
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.decision import AgentDecision
from app.domain.policy import PolicyDecision
from app.simulation.executor import SimulatedRecoveryExecutor


def test_benchmark_reproducibility_with_same_seed() -> None:
    gen1 = SyntheticDataGenerator(seed=20260822, customer_count=20)
    dataset1 = gen1.generate()
    runner1 = BenchmarkRunner()
    results1 = runner1.run(dataset1)

    gen2 = SyntheticDataGenerator(seed=20260822, customer_count=20)
    dataset2 = gen2.generate()
    runner2 = BenchmarkRunner()
    results2 = runner2.run(dataset2)

    for strat in ["No Recovery", "Blind Retry", "Repeated Retry", "RecoverFlow"]:
        m1 = results1[strat]
        m2 = results2[strat]
        assert m1.total_cases == m2.total_cases
        assert m1.recovered_cases == m2.recovered_cases
        assert m1.recovery_rate == m2.recovery_rate
        assert m1.total_recovered_revenue == m2.total_recovered_revenue
        assert m1.execution_count == m2.execution_count


def test_benchmark_cannot_bypass_policy_engine() -> None:
    orchestrator = RecoveryOrchestrator()
    unapproved_policy = PolicyDecision(
        policy_decision_id="pol_bench_rej",
        case_id="case_bench_001",
        decision_id="dec_bench_001",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        allowed=False,
        rejection_reason="Benchmark safety test rejection",
    )

    with pytest.raises(PolicyApprovalRequiredError) as exc_info:
        orchestrator.dispatch(unapproved_policy, None)

    assert "Cannot execute unapproved PolicyDecision" in str(exc_info.value)


def test_benchmark_uses_simulated_executor_only() -> None:
    rf_strategy = RecoverFlowStrategy()
    assert isinstance(rf_strategy.service.executor, SimulatedRecoveryExecutor)
