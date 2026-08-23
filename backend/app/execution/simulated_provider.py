from typing import Optional, Dict
from datetime import datetime

from app.domain.actions import ActionType
from app.domain.execution import RecoveryExecution
from app.domain.execution_result import ExecutionResult, ProviderExecutionStatus
from app.domain.orchestrator import PolicyApprovalRequiredError
from app.execution.provider import RecoveryExecutionProvider
from app.simulation.executor import SimulatedRecoveryExecutor


class SimulatedExecutionProvider(RecoveryExecutionProvider):
    """Simulated execution provider delegating to SimulatedRecoveryExecutor via composition."""

    def __init__(self, executor: Optional[SimulatedRecoveryExecutor] = None) -> None:
        self.executor = executor or SimulatedRecoveryExecutor()
        self._results_cache: Dict[str, ExecutionResult] = {}

    def provider_name(self) -> str:
        return "SIMULATED_PROVIDER"

    def supports(self, action_type: ActionType) -> bool:
        from app.execution.capabilities import capability_registry
        return capability_registry.supports_action(self.provider_name(), action_type)


    def execute_action(self, execution: RecoveryExecution) -> ExecutionResult:
        if not isinstance(execution, RecoveryExecution):
            raise PolicyApprovalRequiredError(
                f"Execution provider accepts ONLY authorized RecoveryExecution instances. Received: {type(execution).__name__}"
            )

        # Idempotency cache lookup
        if execution.execution_id in self._results_cache:
            return self._results_cache[execution.execution_id]

        status = ProviderExecutionStatus.COMPLETED
        provider_ref = f"sim_ref_{execution.execution_id}"
        error_code = None
        error_msg = None

        # Handle specific failure test conditions if flagged in idempotency_key or action
        if "FAIL" in execution.idempotency_key or "FAIL" in execution.execution_id:
            status = ProviderExecutionStatus.FAILED
            error_code = "SIMULATED_PROVIDER_FAILURE"
            error_msg = "Simulated provider failure triggered."
        elif "PENDING" in execution.idempotency_key:
            status = ProviderExecutionStatus.PROCESSING

        result = ExecutionResult(
            execution_id=execution.execution_id,
            idempotency_key=execution.idempotency_key,
            status=status,
            provider=self.provider_name(),
            provider_reference=provider_ref,
            amount_processed=100.0,
            currency="INR",
            error_code=error_code,
            error_message=error_msg,
            executed_at=datetime.now(),
            metadata={"case_id": execution.case_id, "action_type": execution.action.action_type.value},
        )
        self._results_cache[execution.execution_id] = result
        return result

    def get_status(self, execution_id: str) -> ExecutionResult:
        if execution_id in self._results_cache:
            return self._results_cache[execution_id]
        return ExecutionResult(
            execution_id=execution_id,
            idempotency_key=f"ik_{execution_id}",
            status=ProviderExecutionStatus.UNKNOWN,
            provider=self.provider_name(),
            error_code="EXECUTION_NOT_FOUND",
            error_message=f"Execution '{execution_id}' not found in simulated provider.",
        )
