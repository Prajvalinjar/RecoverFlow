from decimal import Decimal
import pytest

from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.decision import AgentDecision
from app.domain.policy import PolicyDecision
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.outcome import RecoveryOutcome, OutcomeStatus
from app.domain.orchestrator import PolicyApprovalRequiredError

from app.simulation.scenarios import SimulationScenario, SimulationConfig
from app.simulation.executor import SimulatedRecoveryExecutor


@pytest.fixture
def sample_payment() -> Payment:
    return Payment(
        payment_id="pay_sim_001",
        customer_id="cust_100",
        amount=Decimal("2500.00"),
        failure_code=FailureCode.BANK_TIMEOUT,
    )


@pytest.fixture
def sample_execution() -> RecoveryExecution:
    return RecoveryExecution(
        execution_id="exec_sim_001",
        case_id="case_sim_001",
        policy_decision_id="pol_sim_001",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_AFTER_DELAY, delay_hours=1),
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="rec_case_sim_001_RETRY_AFTER_DELAY_1",
    )


def test_executor_accepts_authorized_execution(sample_execution: RecoveryExecution, sample_payment: Payment) -> None:
    executor = SimulatedRecoveryExecutor()
    outcome = executor.execute(sample_execution, sample_payment)

    assert isinstance(outcome, RecoveryOutcome)
    assert outcome.case_id == sample_execution.case_id
    assert outcome.execution_id == sample_execution.execution_id
    assert sample_execution.status == ExecutionStatus.COMPLETED


def test_executor_rejects_agent_decision(sample_payment: Payment) -> None:
    executor = SimulatedRecoveryExecutor()
    agent_decision = AgentDecision(
        decision_id="dec_unauthorized",
        case_id="case_001",
        recommended_action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        confidence=0.9,
        rationale="Direct agent decision",
    )

    with pytest.raises(PolicyApprovalRequiredError) as exc_info:
        executor.execute(agent_decision, sample_payment)

    assert "rejected input" in str(exc_info.value)


def test_executor_rejects_unapproved_policy_decision(sample_payment: Payment) -> None:
    executor = SimulatedRecoveryExecutor()
    policy_decision = PolicyDecision(
        policy_decision_id="pol_unapproved",
        case_id="case_001",
        decision_id="dec_001",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        allowed=False,
        rejection_reason="Max retries exceeded",
    )

    with pytest.raises(PolicyApprovalRequiredError) as exc_info:
        executor.execute(policy_decision, sample_payment)

    assert "rejected input" in str(exc_info.value)


def test_executor_enforces_idempotency(sample_execution: RecoveryExecution, sample_payment: Payment) -> None:
    executor = SimulatedRecoveryExecutor()

    # First execution call
    outcome_1 = executor.execute(sample_execution, sample_payment)

    # Second execution call with identical execution & idempotency key
    outcome_2 = executor.execute(sample_execution, sample_payment)

    # Must return exact same outcome instance without generating a second simulated event
    assert outcome_1.outcome_id == outcome_2.outcome_id
    assert outcome_1.recovered_amount == outcome_2.recovered_amount
    assert outcome_1 == outcome_2


def test_executor_explicit_scenario_overrides(sample_execution: RecoveryExecution, sample_payment: Payment) -> None:
    executor = SimulatedRecoveryExecutor()

    # Test FAILURE scenario
    fail_execution = RecoveryExecution(
        execution_id="exec_fail",
        case_id="case_fail",
        policy_decision_id="pol_fail",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="rec_case_fail_RETRY_IMMEDIATE_1",
    )
    outcome_fail = executor.execute(fail_execution, sample_payment, SimulationScenario.FAILURE)
    assert outcome_fail.status == OutcomeStatus.NOT_RECOVERED
    assert outcome_fail.recovered_amount == Decimal("0.00")

    # Test SUCCESS scenario
    succ_execution = RecoveryExecution(
        execution_id="exec_succ",
        case_id="case_succ",
        policy_decision_id="pol_succ",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="rec_case_succ_RETRY_IMMEDIATE_1",
    )
    outcome_succ = executor.execute(succ_execution, sample_payment, SimulationScenario.SUCCESS)
    assert outcome_succ.status == OutcomeStatus.RECOVERED
    assert outcome_succ.recovered_amount == sample_payment.amount
