from decimal import Decimal
from datetime import datetime, timedelta
import pytest

from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState, CasePriority
from app.domain.actions import ActionType
from app.domain.agent import PrototypeRecoveryAgent, AgentReasoningInput
from app.domain.policy import DeterministicPolicyEngine, PolicyEvaluationContext
from app.domain.orchestrator import RecoveryOrchestrator, PolicyApprovalRequiredError
from app.domain.execution import RecoveryExecution

from app.intelligence.failure_classifier import FailureClassifier, FailureCategory, FailureSeverity
from app.intelligence.recovery_signals import UrgencyLevel
from app.intelligence.scoring import RecoverabilityLevel, HeuristicRecoverabilityScorer
from app.intelligence.opportunity import RecoveryOpportunity, ActionabilityState
from app.intelligence.detector import RecoveryOpportunityDetector


@pytest.fixture
def sample_payment() -> Payment:
    return Payment(
        payment_id="pay_100",
        customer_id="cust_555",
        amount=Decimal("2500.00"),
        currency="INR",
        status=PaymentStatus.FAILED,
        failure_code=FailureCode.BANK_TIMEOUT,
        failure_reason="Gateway timeout",
    )


@pytest.fixture
def sample_customer() -> CustomerContext:
    return CustomerContext(
        customer_id="cust_555",
        historical_success_count=10,
        historical_failure_count=1,
        average_payment_delay_hours=6.0,
        previous_recovery_success_rate=0.9,
        customer_segment="PREMIUM",
        total_spent=Decimal("50000.00"),
    )


@pytest.fixture
def sample_case() -> RecoveryCase:
    return RecoveryCase(
        case_id="case_100",
        payment_id="pay_100",
        customer_id="cust_555",
        amount_at_risk=Decimal("2500.00"),
        state=CaseState.DETECTED,
        priority=CasePriority.MEDIUM,
        attempts_count=0,
        max_allowed_attempts=3,
    )


# 1. Temporary failure classification
def test_temporary_failure_classification(sample_payment: Payment) -> None:
    classifier = FailureClassifier()
    classification = classifier.classify(sample_payment)

    assert classification.category == FailureCategory.TEMPORARY
    assert classification.severity == FailureSeverity.LOW
    assert "timeout" in classification.explanation.lower()


# 2. Funds / Limit failure classification
def test_funds_limit_failure_classification() -> None:
    payment = Payment(
        payment_id="pay_funds",
        customer_id="cust_1",
        amount=Decimal("1500.00"),
        failure_code=FailureCode.INSUFFICIENT_FUNDS,
    )
    classifier = FailureClassifier()
    classification = classifier.classify(payment)

    assert classification.category == FailureCategory.LIMIT_OR_FUNDS
    assert classification.severity == FailureSeverity.MEDIUM


# 3. Authentication / Payment Method classification
def test_auth_payment_method_classification() -> None:
    classifier = FailureClassifier()

    auth_payment = Payment(payment_id="p1", customer_id="c1", amount=Decimal("500.00"), failure_code=FailureCode.AUTHENTICATION_FAILURE)
    card_payment = Payment(payment_id="p2", customer_id="c1", amount=Decimal("500.00"), failure_code=FailureCode.CARD_DECLINED)

    c_auth = classifier.classify(auth_payment)
    c_card = classifier.classify(card_payment)

    assert c_auth.category == FailureCategory.AUTHENTICATION_REQUIRED
    assert c_card.category == FailureCategory.PAYMENT_METHOD_ISSUE


# 4. Unknown failure classification
def test_unknown_failure_classification() -> None:
    payment = Payment(payment_id="p_unk", customer_id="c1", amount=Decimal("100.00"), failure_code=None, failure_reason="Unspecified error")
    classifier = FailureClassifier()
    classification = classifier.classify(payment)

    assert classification.category == FailureCategory.UNKNOWN
    assert classification.explanation == "Unspecified error"


# 5. High recoverability scenario
def test_high_recoverability_scenario(
    sample_payment: Payment, sample_customer: CustomerContext, sample_case: RecoveryCase
) -> None:
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, sample_customer, sample_case)

    assert opportunity.recoverability_level == RecoverabilityLevel.HIGH
    assert opportunity.recoverability_score >= 70.0
    assert opportunity.actionability == ActionabilityState.READY
    assert ActionType.RETRY_IMMEDIATE in opportunity.candidate_action_types


# 6. Medium recoverability scenario
def test_medium_recoverability_scenario(sample_customer: CustomerContext) -> None:
    payment = Payment(payment_id="p_med", customer_id="c1", amount=Decimal("5000.00"), failure_code=FailureCode.INSUFFICIENT_FUNDS)
    case = RecoveryCase(case_id="c_med", payment_id="p_med", customer_id="c1", amount_at_risk=Decimal("5000.00"))

    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(payment, sample_customer, case)

    assert opportunity.recoverability_level in (RecoverabilityLevel.HIGH, RecoverabilityLevel.MEDIUM)
    assert opportunity.actionability == ActionabilityState.READY


# 7. Low recoverability scenario
def test_low_recoverability_scenario() -> None:
    poor_customer = CustomerContext(customer_id="c_poor", historical_success_count=0, historical_failure_count=5)
    payment = Payment(payment_id="p_low", customer_id="c_poor", amount=Decimal("60000.00"), failure_code=FailureCode.CARD_DECLINED)
    case = RecoveryCase(case_id="c_low", payment_id="p_low", customer_id="c_poor", amount_at_risk=Decimal("60000.00"), attempts_count=2)

    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(payment, poor_customer, case)

    assert opportunity.recoverability_level in (RecoverabilityLevel.LOW, RecoverabilityLevel.NOT_RECOMMENDED)


# 8. Exhausted retries scenario
def test_exhausted_retries_scenario(sample_payment: Payment, sample_customer: CustomerContext) -> None:
    exhausted_case = RecoveryCase(
        case_id="c_exh", payment_id="p_100", customer_id="c1", amount_at_risk=Decimal("1000.00"), attempts_count=3, max_allowed_attempts=3
    )
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, sample_customer, exhausted_case)

    assert opportunity.recoverability_level == RecoverabilityLevel.NOT_RECOMMENDED
    assert opportunity.recoverability_score == 0.0
    assert opportunity.actionability == ActionabilityState.DO_NOT_ACT


# 9. Terminal case scenario
def test_terminal_case_scenario(sample_payment: Payment, sample_customer: CustomerContext) -> None:
    terminal_case = RecoveryCase(
        case_id="c_term", payment_id="p_100", customer_id="c1", amount_at_risk=Decimal("1000.00"), state=CaseState.RECOVERED
    )
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, sample_customer, terminal_case)

    assert opportunity.recoverability_level == RecoverabilityLevel.NOT_RECOMMENDED
    assert opportunity.actionability == ActionabilityState.DO_NOT_ACT


# 10. Poor customer history scenario
def test_poor_customer_history_scenario(sample_payment: Payment, sample_case: RecoveryCase) -> None:
    poor_customer = CustomerContext(customer_id="c_bad", historical_success_count=1, historical_failure_count=8)
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, poor_customer, sample_case)

    assert len(opportunity.risk_factors) > 0
    assert any("Low customer payment success rate" in r for r in opportunity.risk_factors)


# 11. Strong customer history scenario
def test_strong_customer_history_scenario(sample_payment: Payment, sample_case: RecoveryCase) -> None:
    great_customer = CustomerContext(customer_id="c_great", historical_success_count=15, historical_failure_count=0)
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, great_customer, sample_case)

    assert len(opportunity.supporting_signals) > 0
    assert any("Strong customer payment history" in s for s in opportunity.supporting_signals)


# 12. Candidate action identification
def test_candidate_action_identification(sample_payment: Payment, sample_customer: CustomerContext, sample_case: RecoveryCase) -> None:
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, sample_customer, sample_case)

    assert len(opportunity.candidate_action_types) > 0
    assert ActionType.RETRY_IMMEDIATE in opportunity.candidate_action_types


# 13. Explainability and supporting signals
def test_explainability_supporting_signals(sample_payment: Payment, sample_customer: CustomerContext, sample_case: RecoveryCase) -> None:
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, sample_customer, sample_case)

    assert len(opportunity.primary_reason) > 0
    assert len(opportunity.supporting_signals) > 0


# 14. Deterministic reproducibility
def test_deterministic_reproducibility(sample_payment: Payment, sample_customer: CustomerContext, sample_case: RecoveryCase) -> None:
    detector = RecoveryOpportunityDetector()
    fixed_time = datetime(2026, 8, 21, 12, 0, 0)

    opp1 = detector.detect(sample_payment, sample_customer, sample_case, evaluation_time=fixed_time)
    opp2 = detector.detect(sample_payment, sample_customer, sample_case, evaluation_time=fixed_time)

    assert opp1.recoverability_score == opp2.recoverability_score
    assert opp1.recoverability_level == opp2.recoverability_level
    assert opp1.actionability == opp2.actionability
    assert opp1.candidate_action_types == opp2.candidate_action_types


# 15. Cooldown unsatisfied produces WAIT state
def test_cooldown_unsatisfied_produces_wait_state(
    sample_payment: Payment, sample_customer: CustomerContext, sample_case: RecoveryCase
) -> None:
    now = datetime.now()
    sample_case.last_attempt_at = now - timedelta(seconds=60)  # 60s ago (< 300s cooldown)

    detector = RecoveryOpportunityDetector(cooldown_seconds=300)
    opportunity = detector.detect(sample_payment, sample_customer, sample_case, evaluation_time=now)

    assert opportunity.actionability == ActionabilityState.WAIT


# 16. Safety boundary: RecoveryOpportunity cannot directly execute or call RecoveryOrchestrator
def test_safety_boundary_intelligence_cannot_authorize_execution(
    sample_payment: Payment, sample_customer: CustomerContext, sample_case: RecoveryCase
) -> None:
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, sample_customer, sample_case)
    orchestrator = RecoveryOrchestrator()

    # RecoveryOpportunity has NO method to create a RecoveryExecution or bypass policy
    assert not hasattr(opportunity, "execute")
    assert not hasattr(opportunity, "authorize")

    # Attempting to submit RecoveryOpportunity to RecoveryOrchestrator MUST raise PolicyApprovalRequiredError
    with pytest.raises(PolicyApprovalRequiredError) as exc_info:
        orchestrator.dispatch(opportunity, sample_case)

    assert "Expected approved PolicyDecision" in str(exc_info.value) or "Invalid execution authorization" in str(exc_info.value)


# 17. RecoveryOpportunity can be supplied to AgentReasoningInput
def test_opportunity_supplied_to_agent_reasoning_input(
    sample_payment: Payment, sample_customer: CustomerContext, sample_case: RecoveryCase
) -> None:
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, sample_customer, sample_case)

    input_data = AgentReasoningInput(
        case=sample_case,
        payment=sample_payment,
        customer=sample_customer,
        opportunity=opportunity,
    )

    assert input_data.opportunity == opportunity
    assert input_data.opportunity.case_id == sample_case.case_id


# 18. PrototypeRecoveryAgent uses opportunity context without bypassing policy
def test_prototype_agent_uses_opportunity_context(
    sample_payment: Payment, sample_customer: CustomerContext, sample_case: RecoveryCase
) -> None:
    detector = RecoveryOpportunityDetector()
    opportunity = detector.detect(sample_payment, sample_customer, sample_case)

    agent = PrototypeRecoveryAgent()
    engine = DeterministicPolicyEngine()
    orchestrator = RecoveryOrchestrator()

    # Agent receives opportunity context
    decision = agent.recommend(sample_case, sample_payment, sample_customer, opportunity=opportunity)

    assert "Intelligence Diagnosis:" in decision.rationale
    assert any("Opportunity Score:" in factor for factor in decision.contributing_factors)

    # Must still pass through DeterministicPolicyEngine
    policy_context = PolicyEvaluationContext(
        case=sample_case, payment=sample_payment, customer=sample_customer, agent_decision=decision
    )
    policy_decision = engine.evaluate(policy_context)
    assert policy_decision.allowed is True

    # Execution requires approved PolicyDecision
    execution = orchestrator.dispatch(policy_decision, sample_case)
    assert isinstance(execution, RecoveryExecution)
