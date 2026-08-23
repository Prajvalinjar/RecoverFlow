from decimal import Decimal
from datetime import datetime, timedelta
import pytest

from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState, CasePriority
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.decision import AgentDecision
from app.domain.agent import PrototypeRecoveryAgent, AgentReasoningInput
from app.domain.policy import PolicyEvaluationContext, PolicyDecision, DeterministicPolicyEngine
from app.domain.orchestrator import RecoveryOrchestrator, PolicyApprovalRequiredError
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.outcome import RecoveryOutcome, OutcomeStatus
from app.domain.audit import AuditTrail, AuditEventType


@pytest.fixture
def sample_payment() -> Payment:
    return Payment(
        payment_id="pay_12345",
        customer_id="cust_999",
        amount=Decimal("4999.00"),
        currency="INR",
        status=PaymentStatus.FAILED,
        failure_code=FailureCode.INSUFFICIENT_FUNDS,
        failure_reason="Insufficient balance",
        payment_method="UPI",
    )


@pytest.fixture
def sample_customer() -> CustomerContext:
    return CustomerContext(
        customer_id="cust_999",
        historical_success_count=8,
        historical_failure_count=1,
        average_payment_delay_hours=12.5,
        previous_recovery_success_rate=0.88,
        customer_segment="PREMIUM",
        total_spent=Decimal("45000.00"),
    )


@pytest.fixture
def sample_case() -> RecoveryCase:
    return RecoveryCase(
        case_id="case_001",
        payment_id="pay_12345",
        customer_id="cust_999",
        amount_at_risk=Decimal("4999.00"),
        state=CaseState.DETECTED,
        priority=CasePriority.HIGH,
        attempts_count=0,
        max_allowed_attempts=3,
    )


# 1. Agent produces a structured AgentDecision
def test_agent_produces_structured_decision(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    agent = PrototypeRecoveryAgent()
    decision = agent.recommend(sample_case, sample_payment, sample_customer)

    assert isinstance(decision, AgentDecision)
    assert decision.case_id == "case_001"
    assert 0.0 <= decision.confidence <= 1.0
    assert len(decision.rationale) > 0
    assert len(decision.contributing_factors) > 0


# 2. AgentDecision contains an explicit recommended action
def test_decision_contains_explicit_action(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    agent = PrototypeRecoveryAgent()
    decision = agent.recommend(sample_case, sample_payment, sample_customer)

    assert isinstance(decision.recommended_action, CandidateRecoveryAction)
    assert decision.recommended_action.action_type in ActionType
    assert decision.recommended_action.action_type == ActionType.RETRY_AFTER_DELAY


# 3. Policy engine can approve a valid recommendation
def test_policy_engine_approves_valid_recommendation(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    agent = PrototypeRecoveryAgent()
    engine = DeterministicPolicyEngine()

    decision = agent.recommend(sample_case, sample_payment, sample_customer)
    context = PolicyEvaluationContext(
        case=sample_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )

    policy_decision = engine.evaluate(context)

    assert isinstance(policy_decision, PolicyDecision)
    assert policy_decision.allowed is True
    assert policy_decision.rejection_reason is None
    assert "MaxRetryAttemptsRule" in policy_decision.rules_evaluated


# 4. Policy engine rejects an action when retry limit is exceeded
def test_policy_engine_rejects_max_retries_exceeded(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    sample_case.attempts_count = 3  # Reached max 3 attempts
    agent = PrototypeRecoveryAgent()
    engine = DeterministicPolicyEngine()

    decision = agent.recommend(sample_case, sample_payment, sample_customer)
    context = PolicyEvaluationContext(
        case=sample_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )

    policy_decision = engine.evaluate(context)

    assert policy_decision.allowed is False
    assert "Maximum retry attempts limit" in (policy_decision.rejection_reason or "")


# 5. Policy engine rejects an action when cooldown is not satisfied
def test_policy_engine_rejects_cooldown_not_satisfied(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    # Set failure to BANK_TIMEOUT so agent recommends RETRY_IMMEDIATE
    payment = Payment(
        payment_id="pay_timeout",
        customer_id="cust_999",
        amount=Decimal("1000.00"),
        failure_code=FailureCode.BANK_TIMEOUT,
    )
    sample_case.attempts_count = 1
    sample_case.last_attempt_at = datetime.now() - timedelta(seconds=30)  # Only 30s ago (< 300s required)

    agent = PrototypeRecoveryAgent()
    engine = DeterministicPolicyEngine(min_cooldown_seconds=300)

    decision = agent.recommend(sample_case, payment, sample_customer)
    context = PolicyEvaluationContext(
        case=sample_case, payment=payment, customer=sample_customer, agent_decision=decision
    )

    policy_decision = engine.evaluate(context)

    assert policy_decision.allowed is False
    assert "Cooldown period not satisfied" in (policy_decision.rejection_reason or "")


# 6. Policy engine rejects an action when amount exceeds configured limit
def test_policy_engine_rejects_amount_exceeding_limit(
    sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    large_case = RecoveryCase(
        case_id="case_large",
        payment_id="pay_large",
        customer_id="cust_999",
        amount_at_risk=Decimal("150000.00"),  # Exceeds 100k threshold
    )
    agent = PrototypeRecoveryAgent()
    engine = DeterministicPolicyEngine(max_amount_threshold=Decimal("100000.00"))

    decision = agent.recommend(large_case, sample_payment, sample_customer)
    context = PolicyEvaluationContext(
        case=large_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )

    policy_decision = engine.evaluate(context)

    assert policy_decision.allowed is False
    assert "exceeds automated retry threshold" in (policy_decision.rejection_reason or "")


# 7. Policy engine rejects actions for terminal cases
def test_policy_engine_rejects_terminal_cases(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    sample_case.state = CaseState.RECOVERED
    agent = PrototypeRecoveryAgent()
    engine = DeterministicPolicyEngine()

    decision = AgentDecision(
        decision_id="dec_terminal",
        case_id=sample_case.case_id,
        recommended_action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        confidence=0.9,
        rationale="Attempting retry on recovered case",
    )
    context = PolicyEvaluationContext(
        case=sample_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )

    policy_decision = engine.evaluate(context)

    assert policy_decision.allowed is False
    assert "terminal state" in (policy_decision.rejection_reason or "")


# 8. RecoveryOrchestrator cannot execute an unapproved policy decision
def test_orchestrator_rejects_unapproved_policy_decision(sample_case: RecoveryCase) -> None:
    orchestrator = RecoveryOrchestrator()
    unapproved_decision = PolicyDecision(
        policy_decision_id="pol_rejected",
        case_id=sample_case.case_id,
        decision_id="dec_123",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        allowed=False,
        rejection_reason="Max retries exceeded",
    )

    with pytest.raises(PolicyApprovalRequiredError) as exc_info:
        orchestrator.dispatch(unapproved_decision, sample_case)

    assert "Cannot execute unapproved PolicyDecision" in str(exc_info.value)


# 9. RecoveryOrchestrator rejects direct AgentDecision input
def test_orchestrator_rejects_direct_agent_decision(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    agent = PrototypeRecoveryAgent()
    orchestrator = RecoveryOrchestrator()

    direct_decision = agent.recommend(sample_case, sample_payment, sample_customer)

    with pytest.raises(PolicyApprovalRequiredError) as exc_info:
        orchestrator.dispatch(direct_decision, sample_case)

    assert "Direct AgentDecision submitted to RecoveryOrchestrator" in str(exc_info.value)


# 10. RecoveryOrchestrator can accept an approved policy decision
def test_orchestrator_can_accept_approved_policy_decision(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    agent = PrototypeRecoveryAgent()
    engine = DeterministicPolicyEngine()
    orchestrator = RecoveryOrchestrator()

    decision = agent.recommend(sample_case, sample_payment, sample_customer)
    context = PolicyEvaluationContext(
        case=sample_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )
    policy_decision = engine.evaluate(context)

    execution = orchestrator.dispatch(policy_decision, sample_case)

    assert isinstance(execution, RecoveryExecution)
    assert execution.status == ExecutionStatus.DISPATCHED
    assert execution.case_id == sample_case.case_id
    assert sample_case.state == CaseState.EXECUTING
    assert sample_case.attempts_count == 1


# 11. RecoveryExecution contains an idempotency key
def test_execution_contains_idempotency_key(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    agent = PrototypeRecoveryAgent()
    engine = DeterministicPolicyEngine()
    orchestrator = RecoveryOrchestrator()

    decision = agent.recommend(sample_case, sample_payment, sample_customer)
    context = PolicyEvaluationContext(
        case=sample_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )
    policy_decision = engine.evaluate(context)

    execution = orchestrator.dispatch(policy_decision, sample_case)

    assert len(execution.idempotency_key) > 0
    assert execution.idempotency_key == f"rec_{sample_case.case_id}_RETRY_AFTER_DELAY_1"


# 12. Outcome can represent recovered and failed states
def test_outcome_represents_recovered_and_failed_states() -> None:
    recovered_outcome = RecoveryOutcome(
        outcome_id="out_001",
        case_id="case_001",
        execution_id="exec_100",
        status=OutcomeStatus.RECOVERED,
        recovered_amount=Decimal("4999.00"),
    )

    failed_outcome = RecoveryOutcome(
        outcome_id="out_002",
        case_id="case_001",
        execution_id="exec_101",
        status=OutcomeStatus.FAILED,
        recovered_amount=Decimal("0.00"),
        failure_reason="Card expired on second retry",
    )

    assert recovered_outcome.status == OutcomeStatus.RECOVERED
    assert recovered_outcome.recovered_amount == Decimal("4999.00")
    assert failed_outcome.status == OutcomeStatus.FAILED
    assert failed_outcome.recovered_amount == Decimal("0.00")


# 13. Audit events trace lifecycle
def test_audit_events_trace_lifecycle(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    audit = AuditTrail()
    agent = PrototypeRecoveryAgent()
    engine = DeterministicPolicyEngine()
    orchestrator = RecoveryOrchestrator()

    # Step 1: Detect case
    audit.record(sample_case.case_id, AuditEventType.CASE_DETECTED, "System", {"amount": str(sample_case.amount_at_risk)})

    # Step 2: Agent recommend
    decision = agent.recommend(sample_case, sample_payment, sample_customer)
    audit.record(
        sample_case.case_id,
        AuditEventType.AGENT_DECISION_CREATED,
        "Agent:Prototype",
        {"recommended_action": decision.recommended_action.action_type.value},
    )

    # Step 3: Policy evaluate
    context = PolicyEvaluationContext(
        case=sample_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )
    policy_decision = engine.evaluate(context)
    audit.record(
        sample_case.case_id,
        AuditEventType.POLICY_EVALUATED,
        "PolicyEngine",
        {"allowed": policy_decision.allowed},
    )

    # Step 4: Execute
    execution = orchestrator.dispatch(policy_decision, sample_case)
    audit.record(
        sample_case.case_id,
        AuditEventType.RECOVERY_EXECUTED,
        "Orchestrator",
        {"idempotency_key": execution.idempotency_key},
    )

    events = audit.get_events_for_case(sample_case.case_id)
    assert len(events) == 4
    assert events[0].event_type == AuditEventType.CASE_DETECTED
    assert events[1].event_type == AuditEventType.AGENT_DECISION_CREATED
    assert events[2].event_type == AuditEventType.POLICY_EVALUATED
    assert events[3].event_type == AuditEventType.RECOVERY_EXECUTED


# 14. PolicyEvaluationContext validates case_id mismatch
def test_policy_evaluation_context_validates_case_id_mismatch(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    decision_mismatched = AgentDecision(
        decision_id="dec_wrong",
        case_id="DIFFERENT_CASE_ID",
        recommended_action=CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE),
        confidence=0.8,
        rationale="Test mismatch",
    )

    with pytest.raises(ValueError) as exc_info:
        PolicyEvaluationContext(
            case=sample_case, payment=sample_payment, customer=sample_customer, agent_decision=decision_mismatched
        )

    assert "does not match RecoveryCase case_id" in str(exc_info.value)
