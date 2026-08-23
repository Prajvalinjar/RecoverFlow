import pytest
from app.recovery.reconciliation import RecoveryReconciliationService
from app.domain.execution_result import ExecutionResult, ProviderExecutionStatus
from app.domain.outcome import OutcomeStatus
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.actions import Action, ActionType


def test_unknown_provider_state_never_auto_recovered():
    service = RecoveryReconciliationService()
    result = ExecutionResult(
        execution_id="exec_unk_01",
        idempotency_key="ik_unk_01",
        status=ProviderExecutionStatus.UNKNOWN,
        provider="razorpay",
        error_message="Provider timeout or ambiguous status.",
    )
    execution = RecoveryExecution(
        execution_id="exec_unk_01",
        case_id="case_unk_01",
        policy_decision_id="pol_unk_01",
        action=Action(action_type=ActionType.SEND_PAYMENT_LINK),
        idempotency_key="ik_unk_01",
    )
    case = RecoveryCase(case_id="case_unk_01", payment_id="pay_unk_01", customer_id="cust_unk_01")

    outcome = service.reconcile(result, execution, case)

    # CRITICAL INVARIANT: UNKNOWN status MUST NEVER automatically become RECOVERED
    assert outcome.status != OutcomeStatus.RECOVERED
    assert outcome.status == OutcomeStatus.PENDING
    assert case.state != CaseState.RECOVERED
    assert execution.status == ExecutionStatus.UNKNOWN
