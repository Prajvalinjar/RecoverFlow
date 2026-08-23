from decimal import Decimal
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from app.domain.execution_result import ExecutionResult, ProviderExecutionStatus
from app.domain.outcome import RecoveryOutcome, OutcomeStatus
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.audit import AuditTrail, AuditEventType


class ReconciliationStatus(str, Enum):
    NOT_REQUIRED = "NOT_REQUIRED"
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    RECONCILED = "RECONCILED"
    FAILED = "FAILED"
    MANUAL_REVIEW = "MANUAL_REVIEW"


@dataclass
class ReconciliationRecord:
    record_id: str
    execution_id: str
    case_id: str
    status: ReconciliationStatus
    attempt_count: int = 1
    started_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    correlation_id: Optional[str] = None


class RecoveryReconciliationService:
    """Service reconciling ExecutionResult with RecoveryOutcome and updating domain models."""

    def reconcile(
        self,
        result: ExecutionResult,
        execution: RecoveryExecution,
        case: RecoveryCase,
        audit_trail: Optional[AuditTrail] = None,
    ) -> RecoveryOutcome:
        # Check NormalizedProviderResult status if present in result.metadata
        norm_status = result.metadata.get("status") if isinstance(result.metadata, dict) else None

        if norm_status in ("UNKNOWN", "TIMEOUT", "AMBIGUOUS") or result.status == ProviderExecutionStatus.UNKNOWN:
            outcome_status = OutcomeStatus.PENDING
            case_state = CaseState.EXECUTING
            execution_status = ExecutionStatus.UNKNOWN
            rec_status = ReconciliationStatus.MANUAL_REVIEW
        elif norm_status == "PENDING" or result.status in (ProviderExecutionStatus.PROCESSING, ProviderExecutionStatus.ACCEPTED):
            outcome_status = OutcomeStatus.PENDING
            case_state = CaseState.EXECUTING
            execution_status = ExecutionStatus.PROCESSING
            rec_status = ReconciliationStatus.IN_PROGRESS
        elif result.status == ProviderExecutionStatus.COMPLETED or norm_status == "SUCCESS":
            outcome_status = OutcomeStatus.RECOVERED
            case_state = CaseState.RECOVERED
            execution_status = ExecutionStatus.COMPLETED
            rec_status = ReconciliationStatus.RECONCILED
        elif result.status == ProviderExecutionStatus.FAILED or norm_status in ("FAILED", "UNSUPPORTED"):
            outcome_status = OutcomeStatus.FAILED
            case_state = CaseState.FAILED
            execution_status = ExecutionStatus.FAILED
            rec_status = ReconciliationStatus.FAILED
        elif result.status == ProviderExecutionStatus.REJECTED or norm_status == "REJECTED":
            outcome_status = OutcomeStatus.STOPPED
            case_state = CaseState.STOPPED
            execution_status = ExecutionStatus.REJECTED
            rec_status = ReconciliationStatus.FAILED
        else:
            outcome_status = OutcomeStatus.PENDING
            case_state = CaseState.EXECUTING
            execution_status = ExecutionStatus.UNKNOWN
            rec_status = ReconciliationStatus.MANUAL_REVIEW

        # Transition execution status safely
        if execution.status != execution_status:
            execution.transition_to(execution_status)

        if result.provider_reference:
            execution.provider_reference = result.provider_reference
        if result.error_message:
            execution.error_message = result.error_message

        # Transition case state safely
        if not case.is_terminal() and case.state != case_state:
            case.transition_to(case_state)

        recovered_amt = (
            Decimal(str(result.amount_processed))
            if (result.amount_processed and outcome_status == OutcomeStatus.RECOVERED)
            else Decimal("0.00")
        )

        outcome = RecoveryOutcome(
            outcome_id=f"out_{execution.execution_id}",
            case_id=case.case_id,
            execution_id=execution.execution_id,
            status=outcome_status,
            recovered_amount=recovered_amt,
            failure_reason=result.error_message,
        )

        if audit_trail:
            audit_trail.record(
                case_id=case.case_id,
                event_type=AuditEventType.EXECUTION_RECONCILED,
                actor="RecoveryReconciliationService",
                details={
                    "execution_id": execution.execution_id,
                    "provider_status": result.status.value,
                    "outcome_status": outcome_status.value,
                    "case_state": case_state.value,
                    "reconciliation_status": rec_status.value,
                    "amount_recovered": str(recovered_amt),
                },
                correlation_id=execution.correlation_id,
            )

        return outcome
