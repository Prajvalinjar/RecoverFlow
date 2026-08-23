import pytest
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.execution_result import ProviderExecutionStatus
from app.domain.orchestrator import PolicyApprovalRequiredError
from app.execution.simulated_provider import SimulatedExecutionProvider
from app.execution.router import ExecutionProviderRouter


def test_simulated_execution_provider_executes_action() -> None:
    provider = SimulatedExecutionProvider()
    action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE, parameters={})
    execution = RecoveryExecution(
        execution_id="exec_prov_001",
        case_id="case_prov_001",
        policy_decision_id="pol_prov_001",
        action=action,
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="ik_prov_001",
    )

    result = provider.execute_action(execution)
    assert result.execution_id == "exec_prov_001"
    assert result.status == ProviderExecutionStatus.COMPLETED
    assert result.provider == "SIMULATED_PROVIDER"
    assert result.is_successful is True


def test_provider_router_rejects_unauthorized_objects() -> None:
    router = ExecutionProviderRouter()
    
    # Reject arbitrary string or dictionary or unapproved object
    with pytest.raises(PolicyApprovalRequiredError):
        router.execute("UNAUTHORIZED_STRING_INPUT")  # type: ignore

    with pytest.raises(PolicyApprovalRequiredError):
        router.execute({"unauthorized": "dictionary"})  # type: ignore


def test_provider_router_resolves_and_executes() -> None:
    router = ExecutionProviderRouter()
    action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE, parameters={})
    execution = RecoveryExecution(
        execution_id="exec_rtr_001",
        case_id="case_rtr_001",
        policy_decision_id="pol_rtr_001",
        action=action,
        status=ExecutionStatus.DISPATCHED,
        idempotency_key="ik_rtr_001",
    )

    result = router.execute(execution)
    assert result.execution_id == "exec_rtr_001"
    assert result.status == ProviderExecutionStatus.COMPLETED
