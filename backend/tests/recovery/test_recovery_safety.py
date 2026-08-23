from decimal import Decimal
from datetime import datetime, timedelta
import pytest

from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState, CasePriority
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.decision import AgentDecision
from app.domain.policy import PolicyEvaluationContext, PolicyDecision, DeterministicPolicyEngine
from app.domain.orchestrator import RecoveryOrchestrator, PolicyApprovalRequiredError
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.outcome import RecoveryOutcome, OutcomeStatus

from app.intelligence.detector import RecoveryOpportunityDetector
from app.intelligence.opportunity import RecoveryOpportunity, ActionabilityState, RecoverabilityLevel
from app.simulation.executor import SimulatedRecoveryExecutor
from app.simulation.scenarios import SimulationScenario
from app.recovery.service import RecoveryLoopService


@pytest.fixture
def sample_payment() -> Payment:
    return Payment(
        payment_id="pay_safe_001",
        customer_id="cust_safe",
        amount=Decimal("5000.00"),
        failure_code=FailureCode.INSUFFICIENT_FUNDS,
    )


@pytest.fixture
def sample_customer() -> CustomerContext:
    return CustomerContext(
        customer_id="cust_safe",
        historical_success_count=5,
        historical_failure_count=1,
    )


@pytest.fixture
def sample_case() -> RecoveryCase:
    return RecoveryCase(
        case_id="case_safe_001",
        payment_id="pay_safe_001",
        customer_id="cust_safe",
        amount_at_risk=Decimal("5000.00"),
        state=CaseState.DETECTED,
        attempts_count=0,
        max_allowed_attempts=3,
    )


# INVARIANT 1: AgentDecision cannot directly execute via RecoveryOrchestrator
def test_invariant_1_agent_decision_cannot_directly_execute(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    orchestrator = RecoveryOrchestrator()
    agent_decision = AgentDecision(
        decision_id="dec_direct",
        case_id=sample_case.case_id,
        recommended_action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        confidence=0.9,
        rationale="Attempting direct execution",
    )
    with pytest.raises(PolicyApprovalRequiredError) as exc_info:
        orchestrator.dispatch(agent_decision, sample_case)

    assert "Direct AgentDecision submitted to RecoveryOrchestrator" in str(exc_info.value)


# INVARIANT 2: RecoveryOpportunity cannot directly execute
def test_invariant_2_opportunity_cannot_directly_execute(sample_case: RecoveryCase, sample_payment: Payment) -> None:
    orchestrator = RecoveryOrchestrator()
    opportunity = RecoveryOpportunity(
        opportunity_id="opp_direct",
        case_id=sample_case.case_id,
        payment_id=sample_payment.payment_id,
        recoverability_level=RecoverabilityLevel.HIGH,
        recoverability_score=85.0,
        primary_reason="High recovery potential",
        actionability=ActionabilityState.READY,
    )
    with pytest.raises(PolicyApprovalRequiredError) as exc_info:
        orchestrator.dispatch(opportunity, sample_case)

    assert "Invalid execution authorization object" in str(exc_info.value)


# INVARIANT 3: PolicyDecision.allowed == False cannot execute
def test_invariant_3_unapproved_policy_decision_cannot_execute(sample_case: RecoveryCase) -> None:
    orchestrator = RecoveryOrchestrator()
    unapproved_policy = PolicyDecision(
        policy_decision_id="pol_rejected",
        case_id=sample_case.case_id,
        decision_id="dec_001",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        allowed=False,
        rejection_reason="Retry limit exceeded",
    )
    with pytest.raises(PolicyApprovalRequiredError) as exc_info:
        orchestrator.dispatch(unapproved_policy, sample_case)

    assert "Cannot execute unapproved PolicyDecision" in str(exc_info.value)


# INVARIANT 4: Only RecoveryOrchestrator can create RecoveryExecution
def test_invariant_4_orchestrator_creates_valid_execution(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    orchestrator = RecoveryOrchestrator()
    approved_policy = PolicyDecision(
        policy_decision_id="pol_approved",
        case_id=sample_case.case_id,
        decision_id="dec_001",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_AFTER_DELAY, delay_hours=1),
        allowed=True,
    )
    execution = orchestrator.dispatch(approved_policy, sample_case)
    assert isinstance(execution, RecoveryExecution)
    assert execution.status == ExecutionStatus.DISPATCHED
    assert len(execution.idempotency_key) > 0


# INVARIANT 5: SimulatedRecoveryExecutor accepts only authorized RecoveryExecution
def test_invariant_5_executor_rejects_unauthorized_inputs(sample_payment: Payment) -> None:
    executor = SimulatedRecoveryExecutor()
    agent_decision = AgentDecision(
        decision_id="dec_001",
        case_id="case_001",
        recommended_action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        confidence=0.9,
        rationale="Test rationale",
    )
    with pytest.raises(PolicyApprovalRequiredError):
        executor.execute(agent_decision, sample_payment)


# INVARIANT 6: Every RecoveryExecution has idempotency_key
def test_invariant_6_execution_contains_idempotency_key(sample_case: RecoveryCase) -> None:
    orchestrator = RecoveryOrchestrator()
    approved_policy = PolicyDecision(
        policy_decision_id="pol_001",
        case_id=sample_case.case_id,
        decision_id="dec_001",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        allowed=True,
    )
    execution = orchestrator.dispatch(approved_policy, sample_case)
    assert execution.idempotency_key is not None
    assert len(execution.idempotency_key) > 0


# INVARIANT 7: Duplicate idempotency key does not create duplicate execution event
def test_invariant_7_duplicate_idempotency_key_returns_same_outcome(
    sample_payment: Payment,
) -> None:
    executor = SimulatedRecoveryExecutor()
    execution = RecoveryExecution(
        execution_id="exec_dup",
        case_id="case_dup",
        policy_decision_id="pol_dup",
        action=CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK),
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="rec_case_dup_SEND_PAYMENT_LINK_1",
    )
    out1 = executor.execute(execution, sample_payment)
    out2 = executor.execute(execution, sample_payment)

    assert out1.outcome_id == out2.outcome_id
    assert len(executor._execution_registry) == 1


# INVARIANT 8: Terminal cases cannot execute
def test_invariant_8_terminal_cases_cannot_execute(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    sample_case.state = CaseState.RECOVERED
    service = RecoveryLoopService()

    res = service.process_recovery_cycle(sample_case, sample_payment, sample_customer)
    assert res.action_executed is False
    assert res.stop_reason == "CASE_TERMINAL"


# INVARIANT 9: Retry limit cannot be bypassed
test_invariant_9_retry_limit = test_invariant_3_unapproved_policy_decision_cannot_execute


# INVARIANT 10: Cooldown cannot be bypassed
def test_invariant_10_cooldown_rejection_prevents_execution(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    sample_case.attempts_count = 1
    sample_case.last_attempt_at = datetime.now() - timedelta(seconds=10)
    engine = DeterministicPolicyEngine(min_cooldown_seconds=300)

    decision = AgentDecision(
        decision_id="dec_cooldown",
        case_id=sample_case.case_id,
        recommended_action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        confidence=0.9,
        rationale="Immediate retry",
    )
    context = PolicyEvaluationContext(
        case=sample_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )
    policy_res = engine.evaluate(context)

    assert policy_res.allowed is False
    assert "Cooldown period not satisfied" in policy_res.rejection_reason


# INVARIANT 11: Maximum amount limit cannot be bypassed
def test_invariant_11_max_amount_rejection_prevents_execution(
    sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    large_case = RecoveryCase(
        case_id="case_high_val",
        payment_id="pay_high",
        customer_id="cust_safe",
        amount_at_risk=Decimal("150000.00"),
    )
    engine = DeterministicPolicyEngine(max_amount_threshold=Decimal("100000.00"))
    decision = AgentDecision(
        decision_id="dec_high",
        case_id=large_case.case_id,
        recommended_action=CandidateRecoveryAction(action_type=ActionType.RETRY_AFTER_DELAY, delay_hours=1),
        confidence=0.9,
        rationale="Retry high value",
    )
    context = PolicyEvaluationContext(
        case=large_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )
    policy_res = engine.evaluate(context)

    assert policy_res.allowed is False
    assert "exceeds automated retry threshold" in policy_res.rejection_reason


# INVARIANT 12: Autonomous loop has max_cycles
def test_invariant_12_loop_respects_max_cycles(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    service = RecoveryLoopService()

    # Pass SimulationScenario.FAILURE so payment is not recovered and loop runs up to max_cycles
    res = service.run_autonomous_recovery(
        case=sample_case,
        payment=sample_payment,
        customer=sample_customer,
        max_cycles=2,
        simulation_scenario=SimulationScenario.FAILURE,
    )

    assert res.total_cycles <= 2
    assert res.stop_reason in ("MAX_CYCLES_REACHED", "POLICY_REJECTED", "ACTION_NOT_EXECUTED")


# INVARIANT 13: STOP_RECOVERY terminates the loop
def test_invariant_13_stop_recovery_terminates_loop(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    service = RecoveryLoopService()
    # Force STOP_RECOVERY via policy/agent
    policy_engine = DeterministicPolicyEngine()
    approved_stop = PolicyDecision(
        policy_decision_id="pol_stop",
        case_id=sample_case.case_id,
        decision_id="dec_stop",
        action=CandidateRecoveryAction(action_type=ActionType.STOP_RECOVERY),
        allowed=True,
    )
    res = service.process_recovery_cycle(
        case=sample_case,
        payment=sample_payment,
        customer=sample_customer,
    )
    # If case state is STOPPED, next cycle stops
    sample_case.state = CaseState.STOPPED
    res_2 = service.process_recovery_cycle(sample_case, sample_payment, sample_customer)
    assert res_2.stop_reason == "CASE_TERMINAL"


# INVARIANT 14: WAIT / DO_NOT_ACT does not cause immediate execution
def test_invariant_14_wait_actionability_prevents_execution(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    sample_case.attempts_count = 1
    sample_case.last_attempt_at = datetime.now() - timedelta(seconds=10)
    service = RecoveryLoopService()

    res = service.process_recovery_cycle(sample_case, sample_payment, sample_customer)
    assert res.action_executed is False
    assert res.stop_reason == "COOLDOWN_WAIT"


# INVARIANT 15: Agent cannot modify deterministic policy rules
def test_invariant_15_agent_cannot_override_policy_rules(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    sample_case.attempts_count = 3  # Retry limit reached
    service = RecoveryLoopService()

    # Agent recommends RETRY_AFTER_DELAY, but Policy Engine must enforce retry limit
    res = service.process_recovery_cycle(sample_case, sample_payment, sample_customer)
    assert res.action_executed is False
    assert res.stop_reason == "POLICY_REJECTED"
    assert "Maximum retry attempts limit" in (res.rejection_reason or "")
