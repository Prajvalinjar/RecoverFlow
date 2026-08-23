from decimal import Decimal
import pytest
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.execution_result import ExecutionResult, ProviderExecutionStatus
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.outcome import OutcomeStatus
from app.domain.audit import AuditTrail
from app.recovery.reconciliation import RecoveryReconciliationService


def test_reconcile_completed_execution() -> None:
    service = RecoveryReconciliationService()
    audit_trail = AuditTrail()

    action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE, parameters={})
    execution = RecoveryExecution(
        execution_id="exec_rec_001",
        case_id="case_rec_001",
        policy_decision_id="pol_rec_001",
        action=action,
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="ik_rec_001",
    )
    case = RecoveryCase(
        case_id="case_rec_001",
        payment_id="pay_rec_001",
        customer_id="cust_rec_001",
        amount_at_risk=Decimal("2500.00"),
        state=CaseState.EXECUTING,
    )
    result = ExecutionResult(
        execution_id="exec_rec_001",
        idempotency_key="ik_rec_001",
        status=ProviderExecutionStatus.COMPLETED,
        provider="SIMULATED_PROVIDER",
        provider_reference="ref_rec_001",
        amount_processed=2500.0,
    )

    outcome = service.reconcile(result, execution, case, audit_trail)
    assert outcome.status == OutcomeStatus.RECOVERED
    assert outcome.recovered_amount == Decimal("2500.0")
    assert case.state == CaseState.RECOVERED
    assert execution.status == ExecutionStatus.COMPLETED


def test_reconcile_unknown_status_does_not_mark_recovered() -> None:
    service = RecoveryReconciliationService()

    action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE, parameters={})
    execution = RecoveryExecution(
        execution_id="exec_rec_002",
        case_id="case_rec_002",
        policy_decision_id="pol_rec_002",
        action=action,
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="ik_rec_002",
    )
    case = RecoveryCase(
        case_id="case_rec_002",
        payment_id="pay_rec_002",
        customer_id="cust_rec_002",
        amount_at_risk=Decimal("1500.00"),
        state=CaseState.EXECUTING,
    )
    result = ExecutionResult(
        execution_id="exec_rec_002",
        idempotency_key="ik_rec_002",
        status=ProviderExecutionStatus.UNKNOWN,
        provider="SIMULATED_PROVIDER",
        error_code="TIMEOUT",
    )

    outcome = service.reconcile(result, execution, case)
    assert outcome.status == OutcomeStatus.PENDING
    assert case.state == CaseState.EXECUTING
    assert execution.status == ExecutionStatus.UNKNOWN
