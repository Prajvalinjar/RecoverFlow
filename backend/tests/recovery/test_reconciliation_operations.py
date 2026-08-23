from decimal import Decimal
import pytest
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.execution_result import ExecutionResult, ProviderExecutionStatus
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.outcome import OutcomeStatus
from app.domain.audit import AuditTrail
from app.recovery.reconciliation import RecoveryReconciliationService, ReconciliationStatus


def test_reconciliation_status_reconciled_on_completed() -> None:
    service = RecoveryReconciliationService()
    audit_trail = AuditTrail()

    action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE, parameters={})
    execution = RecoveryExecution(
        execution_id="exec_rec_op_001",
        case_id="case_rec_op_001",
        policy_decision_id="pol_rec_op_001",
        action=action,
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="ik_rec_op_001",
    )
    case = RecoveryCase(
        case_id="case_rec_op_001",
        payment_id="pay_rec_op_001",
        customer_id="cust_rec_op_001",
        amount_at_risk=Decimal("2500.00"),
        state=CaseState.EXECUTING,
    )
    result = ExecutionResult(
        execution_id="exec_rec_op_001",
        idempotency_key="ik_rec_op_001",
        status=ProviderExecutionStatus.COMPLETED,
        provider="SIMULATED_PROVIDER",
        provider_reference="ref_rec_op_001",
        amount_processed=2500.0,
    )

    outcome = service.reconcile(result, execution, case, audit_trail)
    assert outcome.status == OutcomeStatus.RECOVERED
    assert case.state == CaseState.RECOVERED
    assert len(audit_trail.all_events) > 0
    assert audit_trail.all_events[-1].details["reconciliation_status"] == ReconciliationStatus.RECONCILED.value


def test_reconciliation_unknown_provider_status_becomes_manual_review() -> None:
    service = RecoveryReconciliationService()
    audit_trail = AuditTrail()

    action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE, parameters={})
    execution = RecoveryExecution(
        execution_id="exec_rec_op_002",
        case_id="case_rec_op_002",
        policy_decision_id="pol_rec_op_002",
        action=action,
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="ik_rec_op_002",
    )
    case = RecoveryCase(
        case_id="case_rec_op_002",
        payment_id="pay_rec_op_002",
        customer_id="cust_rec_op_002",
        amount_at_risk=Decimal("1500.00"),
        state=CaseState.EXECUTING,
    )
    result = ExecutionResult(
        execution_id="exec_rec_op_002",
        idempotency_key="ik_rec_op_002",
        status=ProviderExecutionStatus.UNKNOWN,
        provider="SIMULATED_PROVIDER",
        error_code="TIMEOUT",
    )

    outcome = service.reconcile(result, execution, case, audit_trail)
    assert outcome.status == OutcomeStatus.PENDING
    assert case.state == CaseState.EXECUTING
    assert audit_trail.all_events[-1].details["reconciliation_status"] == ReconciliationStatus.MANUAL_REVIEW.value
