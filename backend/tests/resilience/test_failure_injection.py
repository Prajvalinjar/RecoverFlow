import pytest
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.orchestrator import PolicyApprovalRequiredError
from app.execution.failures import ExecutionFailure, ExecutionFailureCategory
from app.execution.simulated_provider import SimulatedExecutionProvider
from app.execution.router import ExecutionProviderRouter


def test_failure_injection_transient_failure_classification() -> None:
    fail = ExecutionFailure.transient("NETWORK_TIMEOUT", "Connection to payment gateway timed out.")
    assert fail.retryable is True
    assert fail.category == ExecutionFailureCategory.TRANSIENT_PROVIDER_FAILURE


def test_failure_injection_permanent_failure_classification() -> None:
    fail = ExecutionFailure.permanent("EXPIRED_CARD", "Payment card is permanently expired.")
    assert fail.retryable is False
    assert fail.category == ExecutionFailureCategory.PERMANENT_PROVIDER_FAILURE


def test_failure_injection_simulated_provider_handles_failure_flag() -> None:
    provider = SimulatedExecutionProvider()
    action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE, parameters={})
    execution = RecoveryExecution(
        execution_id="exec_FAIL_001",
        case_id="case_fail_001",
        policy_decision_id="pol_fail_001",
        action=action,
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="ik_FAIL_001",
    )

    result = provider.execute_action(execution)
    assert result.status.value == "FAILED"
    assert result.error_code == "SIMULATED_PROVIDER_FAILURE"


def test_failure_injection_unauthorized_execution_blocked() -> None:
    router = ExecutionProviderRouter()
    
    # Attempting to pass non-RecoveryExecution object raises PolicyApprovalRequiredError
    with pytest.raises(PolicyApprovalRequiredError):
        router.execute("UNAUTHORIZED_PAYLOAD")  # type: ignore
