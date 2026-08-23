from decimal import Decimal
from datetime import datetime, timedelta
import pytest

from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState, CasePriority
from app.domain.actions import ActionType
from app.domain.audit import AuditEventType
from app.domain.orchestrator import RecoveryOrchestrator
from app.domain.policy import PolicyDecision
from app.domain.actions import CandidateRecoveryAction
from app.recovery.service import RecoveryLoopService, AutonomousRecoveryResult
from app.simulation.scenarios import SimulationScenario, SimulationConfig


@pytest.fixture
def base_customer() -> CustomerContext:
    return CustomerContext(
        customer_id="cust_e2e",
        historical_success_count=8,
        historical_failure_count=1,
        average_payment_delay_hours=6.0,
        previous_recovery_success_rate=0.90,
        customer_segment="PREMIUM",
        total_spent=Decimal("50000.00"),
    )


# SCENARIO A: Successful first recovery
def test_scenario_a_successful_first_recovery(base_customer: CustomerContext) -> None:
    payment = Payment(
        payment_id="pay_scen_a",
        customer_id=base_customer.customer_id,
        amount=Decimal("2500.00"),
        failure_code=FailureCode.BANK_TIMEOUT,
    )
    case = RecoveryCase(
        case_id="case_scen_a",
        payment_id=payment.payment_id,
        customer_id=base_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
        attempts_count=0,
    )

    service = RecoveryLoopService()
    result = service.run_autonomous_recovery(case=case, payment=payment, customer=base_customer, max_cycles=3)

    assert result.is_recovered is True
    assert result.total_cycles == 1
    assert result.stop_reason == "PAYMENT_RECOVERED"
    assert result.final_case.state == CaseState.RECOVERED
    assert result.cycles[0].agent_decision.recommended_action.action_type in (
        ActionType.RETRY_IMMEDIATE,
        ActionType.RETRY_AFTER_DELAY,
    )
    assert result.cycles[0].policy_decision.allowed is True
    assert result.cycles[0].outcome.status == "RECOVERED"


# SCENARIO B: First attempt fails, second strategy succeeds (Multi-step recovery)
def test_scenario_b_multi_step_recovery(base_customer: CustomerContext) -> None:
    payment = Payment(
        payment_id="pay_scen_b",
        customer_id=base_customer.customer_id,
        amount=Decimal("4999.00"),
        failure_code=FailureCode.INSUFFICIENT_FUNDS,
        attempt_number=1,
    )
    case = RecoveryCase(
        case_id="case_scen_b",
        payment_id=payment.payment_id,
        customer_id=base_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
        attempts_count=0,
        max_allowed_attempts=3,
    )

    service = RecoveryLoopService()
    result = service.run_autonomous_recovery(
        case=case,
        payment=payment,
        customer=base_customer,
        max_cycles=3,
        simulation_scenario=SimulationScenario.CONTEXT_AWARE,
    )

    # Attempt 1: RETRY_AFTER_DELAY fails (first retry for INSUFFICIENT_FUNDS fails in CONTEXT_AWARE)
    # Attempt 2: Agent adapts using previous failure history -> recommends SEND_PAYMENT_LINK -> RECOVERED!
    assert result.total_cycles == 2
    assert result.is_recovered is True
    assert result.stop_reason == "PAYMENT_RECOVERED"
    assert result.final_case.state == CaseState.RECOVERED

    # Cycle 1 vs Cycle 2 decision check
    action_1 = result.cycles[0].agent_decision.recommended_action.action_type
    action_2 = result.cycles[1].agent_decision.recommended_action.action_type

    assert action_1 == ActionType.RETRY_AFTER_DELAY
    assert action_2 in (ActionType.SEND_PAYMENT_LINK, ActionType.SEND_PAYMENT_REMINDER)
    assert "Previous recovery attempt failed" in result.cycles[1].agent_decision.rationale



# SCENARIO C: Policy rejection
def test_scenario_c_policy_rejection(base_customer: CustomerContext) -> None:
    payment = Payment(
        payment_id="pay_scen_c",
        customer_id=base_customer.customer_id,
        amount=Decimal("150000.00"),  # Exceeds max amount threshold of 100k
        failure_code=FailureCode.BANK_TIMEOUT,
    )
    case = RecoveryCase(
        case_id="case_scen_c",
        payment_id=payment.payment_id,
        customer_id=base_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
    )

    service = RecoveryLoopService()
    result = service.run_autonomous_recovery(case=case, payment=payment, customer=base_customer, max_cycles=1)

    assert result.is_recovered is False
    assert result.cycles[0].policy_decision.allowed is False
    assert result.cycles[0].execution is None
    assert result.cycles[0].outcome is None
    assert result.stop_reason == "POLICY_REJECTED"


# SCENARIO D: Cooldown wait
def test_scenario_d_cooldown_wait(base_customer: CustomerContext) -> None:
    payment = Payment(
        payment_id="pay_scen_d",
        customer_id=base_customer.customer_id,
        amount=Decimal("1000.00"),
        failure_code=FailureCode.INSUFFICIENT_FUNDS,
    )
    case = RecoveryCase(
        case_id="case_scen_d",
        payment_id=payment.payment_id,
        customer_id=base_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
        attempts_count=1,
        last_attempt_at=datetime.now() - timedelta(seconds=20),  # On cooldown (<300s)
    )

    service = RecoveryLoopService()
    result = service.run_autonomous_recovery(case=case, payment=payment, customer=base_customer, max_cycles=1)

    assert result.is_recovered is False
    assert result.stop_reason == "COOLDOWN_WAIT"
    assert result.cycles[0].action_executed is False
    assert result.cycles[0].execution is None


# SCENARIO E: Retry exhaustion
def test_scenario_e_retry_exhaustion(base_customer: CustomerContext) -> None:
    payment = Payment(
        payment_id="pay_scen_e",
        customer_id=base_customer.customer_id,
        amount=Decimal("1000.00"),
        failure_code=FailureCode.INSUFFICIENT_FUNDS,
    )
    case = RecoveryCase(
        case_id="case_scen_e",
        payment_id=payment.payment_id,
        customer_id=base_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
        attempts_count=3,
        max_allowed_attempts=3,
    )

    service = RecoveryLoopService()
    result = service.run_autonomous_recovery(case=case, payment=payment, customer=base_customer, max_cycles=1)

    assert result.is_recovered is False
    assert result.cycles[0].policy_decision.allowed is False
    assert result.final_case.state == CaseState.STOPPED
    assert result.stop_reason == "POLICY_REJECTED"


# SCENARIO F: Idempotency
def test_scenario_f_idempotency(base_customer: CustomerContext) -> None:
    service = RecoveryLoopService()
    payment = Payment(
        payment_id="pay_scen_f",
        customer_id=base_customer.customer_id,
        amount=Decimal("2000.00"),
        failure_code=FailureCode.BANK_TIMEOUT,
    )
    case = RecoveryCase(
        case_id="case_scen_f",
        payment_id=payment.payment_id,
        customer_id=base_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
    )

    # First cycle
    cycle_1 = service.process_recovery_cycle(case, payment, base_customer)
    idempotency_key = cycle_1.execution.idempotency_key

    # Submit same execution directly to executor
    duplicate_outcome = service.executor.execute(cycle_1.execution, payment)

    assert cycle_1.outcome.outcome_id == duplicate_outcome.outcome_id
    assert len(service.executor._execution_registry) == 1


# SCENARIO G: Terminal case
def test_scenario_g_terminal_case(base_customer: CustomerContext) -> None:
    payment = Payment(
        payment_id="pay_scen_g",
        customer_id=base_customer.customer_id,
        amount=Decimal("2000.00"),
        failure_code=FailureCode.BANK_TIMEOUT,
    )
    case = RecoveryCase(
        case_id="case_scen_g",
        payment_id=payment.payment_id,
        customer_id=base_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.RECOVERED,
    )

    service = RecoveryLoopService()
    result = service.run_autonomous_recovery(case=case, payment=payment, customer=base_customer)

    assert result.total_cycles == 1
    assert result.cycles[0].action_executed is False
    assert result.stop_reason == "CASE_TERMINAL"


# SCENARIO H: Low recoverability (Poor customer history + severe failure)
def test_scenario_h_low_recoverability() -> None:
    poor_customer = CustomerContext(
        customer_id="cust_poor",
        historical_success_count=0,
        historical_failure_count=10,
        customer_segment="HIGH_RISK",
    )
    payment = Payment(
        payment_id="pay_scen_h",
        customer_id=poor_customer.customer_id,
        amount=Decimal("95000.00"),
        failure_code=FailureCode.AUTHENTICATION_FAILURE,
    )
    case = RecoveryCase(
        case_id="case_scen_h",
        payment_id=payment.payment_id,
        customer_id=poor_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
    )

    service = RecoveryLoopService()
    result = service.run_autonomous_recovery(case=case, payment=payment, customer=poor_customer, max_cycles=1)

    assert result.is_recovered is False
    assert result.cycles[0].opportunity.recoverability_level.value in ("LOW", "VERY_LOW", "NOT_RECOMMENDED")


# SCENARIO I: Max-cycle protection
def test_scenario_i_max_cycle_protection(base_customer: CustomerContext) -> None:
    payment = Payment(
        payment_id="pay_scen_i",
        customer_id=base_customer.customer_id,
        amount=Decimal("2000.00"),
        failure_code=FailureCode.CARD_DECLINED,
    )
    case = RecoveryCase(
        case_id="case_scen_i",
        payment_id=payment.payment_id,
        customer_id=base_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
        attempts_count=0,
        max_allowed_attempts=10,  # High max retries
    )

    service = RecoveryLoopService()
    # Force FAILURE scenario so recovery is not achieved
    result = service.run_autonomous_recovery(
        case=case,
        payment=payment,
        customer=base_customer,
        max_cycles=2,
        simulation_scenario=SimulationScenario.FAILURE,
    )

    assert result.total_cycles <= 2
    assert result.stop_reason in ("MAX_CYCLES_REACHED", "POLICY_REJECTED", "ACTION_NOT_EXECUTED")


# SCENARIO J: Audit completeness
def test_scenario_j_audit_completeness(base_customer: CustomerContext) -> None:
    payment = Payment(
        payment_id="pay_scen_j",
        customer_id=base_customer.customer_id,
        amount=Decimal("1500.00"),
        failure_code=FailureCode.BANK_TIMEOUT,
    )
    case = RecoveryCase(
        case_id="case_scen_j",
        payment_id=payment.payment_id,
        customer_id=base_customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
    )

    service = RecoveryLoopService()
    result = service.run_autonomous_recovery(case=case, payment=payment, customer=base_customer, max_cycles=1)

    event_types = [e.event_type for e in result.audit_events]

    assert AuditEventType.CASE_DETECTED in event_types
    assert AuditEventType.OPPORTUNITY_DETECTED in event_types
    assert AuditEventType.AGENT_ANALYSIS_STARTED in event_types
    assert AuditEventType.AGENT_DECISION_CREATED in event_types
    assert AuditEventType.POLICY_EVALUATED in event_types
    assert AuditEventType.ACTION_APPROVED in event_types
    assert AuditEventType.EXECUTION_DISPATCHED in event_types
    assert AuditEventType.EXECUTION_COMPLETED in event_types
    assert AuditEventType.OUTCOME_RECORDED in event_types
    assert AuditEventType.CASE_EVALUATED in event_types
