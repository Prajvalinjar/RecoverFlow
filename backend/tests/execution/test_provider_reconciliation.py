import pytest
from app.domain.execution_result import ExecutionResult, ProviderExecutionStatus
from app.domain.outcome import OutcomeStatus
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.recovery.reconciliation import RecoveryReconciliationService, ReconciliationStatus


def test_reconciliation_unknown_and_timeout_safety() -> None:
    svc = RecoveryReconciliationService()
    res = ExecutionResult(
        execution_id="ex_rec_unk",
        idempotency_key="ik_rec_unk",
        provider="razorpay",
        status=ProviderExecutionStatus.UNKNOWN,
        metadata={"status": "TIMEOUT"},
    )
    case = RecoveryCase(
        case_id="case_rec_unk",
        payment_id="pay_rec_unk",
        customer_id="cust_rec_unk",
        amount_at_risk=500.0,
        state=CaseState.EXECUTING,
    )
    ex = RecoveryExecution(
        execution_id="ex_rec_unk",
        case_id="case_rec_unk",
        policy_decision_id="pd_rec_unk",
        action=CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK),
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="ik_rec_unk",
    )

    outcome = svc.reconcile(res, ex, case)
    assert outcome.status == OutcomeStatus.PENDING
    assert outcome.recovered_amount == 0.0
    assert case.state == CaseState.EXECUTING


def test_reconciliation_completed_status() -> None:
    service = RecoveryReconciliationService()
    result = ExecutionResult(
        execution_id="exec_rec_01",
        idempotency_key="ik_rec_01",
        status=ProviderExecutionStatus.COMPLETED,
        provider="razorpay",
        amount_processed=100.0,
    )
    execution = RecoveryExecution(
        execution_id="exec_rec_01",
        case_id="case_rec_01",
        policy_decision_id="pol_rec_01",
        action=CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK),
        idempotency_key="ik_rec_01",
    )
    case = RecoveryCase(case_id="case_rec_01", payment_id="pay_rec_01", customer_id="cust_rec_01")

    outcome = service.reconcile(result, execution, case)
    assert outcome.status == OutcomeStatus.RECOVERED
    assert case.state == CaseState.RECOVERED
    assert execution.status == ExecutionStatus.COMPLETED
