from decimal import Decimal
import pytest

from app.domain.payment import Payment, FailureCode
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.policy import PolicyDecision
from app.domain.orchestrator import RecoveryOrchestrator
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.simulation.executor import SimulatedRecoveryExecutor


def test_idempotency_key_format_and_uniqueness() -> None:
    orchestrator = RecoveryOrchestrator()
    case = RecoveryCase(
        case_id="case_idem_001",
        payment_id="pay_idem_001",
        customer_id="cust_idem_001",
        amount_at_risk=Decimal("1000.00"),
    )
    policy = PolicyDecision(
        policy_decision_id="pol_idem_001",
        case_id=case.case_id,
        decision_id="dec_idem_001",
        action=CandidateRecoveryAction(action_type=ActionType.RETRY_AFTER_DELAY, delay_hours=1),
        allowed=True,
    )

    execution_1 = orchestrator.dispatch(policy, case)
    assert execution_1.idempotency_key == "rec_case_idem_001_RETRY_AFTER_DELAY_1"

    # Reset case state for second attempt test
    case.state = CaseState.APPROVED
    execution_2 = orchestrator.dispatch(policy, case)
    assert execution_2.idempotency_key == "rec_case_idem_001_RETRY_AFTER_DELAY_2"


def test_simulated_executor_prevents_duplicate_events() -> None:
    executor = SimulatedRecoveryExecutor()
    payment = Payment(payment_id="pay_idem_001", customer_id="cust_idem_001", amount=Decimal("1000.00"))
    execution = RecoveryExecution(
        execution_id="exec_idem_001",
        case_id="case_idem_001",
        policy_decision_id="pol_idem_001",
        action=CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK),
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="rec_case_idem_001_SEND_PAYMENT_LINK_1",
    )

    outcome_first = executor.execute(execution, payment)
    outcome_second = executor.execute(execution, payment)

    assert outcome_first is outcome_second
    assert outcome_first.outcome_id == outcome_second.outcome_id
    assert len(executor._execution_registry) == 1
