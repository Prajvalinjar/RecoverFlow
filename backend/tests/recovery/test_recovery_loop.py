from decimal import Decimal
import pytest

from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState, CasePriority
from app.domain.actions import ActionType
from app.domain.audit import AuditEventType
from app.recovery.service import RecoveryLoopService, RecoveryCycleResult, AutonomousRecoveryResult
from app.simulation.scenarios import SimulationScenario


@pytest.fixture
def sample_payment() -> Payment:
    return Payment(
        payment_id="pay_loop_001",
        customer_id="cust_loop_001",
        amount=Decimal("3500.00"),
        failure_code=FailureCode.BANK_TIMEOUT,
    )


@pytest.fixture
def sample_customer() -> CustomerContext:
    return CustomerContext(
        customer_id="cust_loop_001",
        historical_success_count=10,
        historical_failure_count=0,
    )


@pytest.fixture
def sample_case() -> RecoveryCase:
    return RecoveryCase(
        case_id="case_loop_001",
        payment_id="pay_loop_001",
        customer_id="cust_loop_001",
        amount_at_risk=Decimal("3500.00"),
        state=CaseState.DETECTED,
        attempts_count=0,
        max_allowed_attempts=3,
    )


def test_single_recovery_cycle_successful(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    service = RecoveryLoopService()

    cycle_res = service.process_recovery_cycle(sample_case, sample_payment, sample_customer)

    assert isinstance(cycle_res, RecoveryCycleResult)
    assert cycle_res.action_executed is True
    assert cycle_res.opportunity is not None
    assert cycle_res.agent_decision is not None
    assert cycle_res.policy_decision is not None
    assert cycle_res.policy_decision.allowed is True
    assert cycle_res.execution is not None
    assert cycle_res.outcome is not None
    assert cycle_res.case_state == CaseState.RECOVERED


def test_run_autonomous_recovery_single_cycle_recovery(
    sample_case: RecoveryCase, sample_payment: Payment, sample_customer: CustomerContext
) -> None:
    service = RecoveryLoopService()

    res = service.run_autonomous_recovery(
        case=sample_case,
        payment=sample_payment,
        customer=sample_customer,
        max_cycles=3,
    )

    assert isinstance(res, AutonomousRecoveryResult)
    assert res.is_recovered is True
    assert res.total_cycles == 1
    assert res.stop_reason == "PAYMENT_RECOVERED"
    assert res.final_case.state == CaseState.RECOVERED
    assert len(res.audit_events) >= 8
