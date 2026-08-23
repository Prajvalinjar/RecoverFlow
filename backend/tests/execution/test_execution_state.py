import pytest
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus, InvalidExecutionStateTransitionError


def test_valid_execution_state_transitions() -> None:
    action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE, parameters={})
    execution = RecoveryExecution(
        execution_id="exec_st_001",
        case_id="case_st_001",
        policy_decision_id="pol_st_001",
        action=action,
        status=ExecutionStatus.PENDING,
        idempotency_key="ik_st_001",
    )

    # PENDING -> DISPATCHED
    execution.transition_to(ExecutionStatus.DISPATCHED)
    assert execution.status == ExecutionStatus.DISPATCHED

    # DISPATCHED -> PROCESSING
    execution.transition_to(ExecutionStatus.PROCESSING)
    assert execution.status == ExecutionStatus.PROCESSING

    # PROCESSING -> COMPLETED
    execution.transition_to(ExecutionStatus.COMPLETED)
    assert execution.status == ExecutionStatus.COMPLETED
    assert execution.is_terminal is True
    assert execution.completed_at is not None


def test_invalid_execution_state_transition_raises_error() -> None:
    action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE, parameters={})
    execution = RecoveryExecution(
        execution_id="exec_st_002",
        case_id="case_st_002",
        policy_decision_id="pol_st_002",
        action=action,
        status=ExecutionStatus.COMPLETED,  # Terminal state
        idempotency_key="ik_st_002",
    )

    # Attempt illegal transition from terminal state COMPLETED to DISPATCHED
    with pytest.raises(InvalidExecutionStateTransitionError):
        execution.transition_to(ExecutionStatus.DISPATCHED)
