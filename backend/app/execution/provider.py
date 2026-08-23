from abc import ABC, abstractmethod
from typing import Optional

from app.domain.actions import ActionType
from app.domain.payment import Payment
from app.domain.execution import RecoveryExecution
from app.domain.execution_result import ExecutionResult
from app.domain.outcome import RecoveryOutcome
from app.domain.orchestrator import PolicyApprovalRequiredError
from app.simulation.executor import SimulatedRecoveryExecutor
from app.simulation.scenarios import SimulationScenario


class RecoveryExecutionProvider(ABC):
    """Abstract interface defining financial execution provider contract.
    
    Provider execution is downstream of deterministic policy authorization and MUST NOT perform policy approval.
    """

    @abstractmethod
    def execute_action(self, execution: RecoveryExecution) -> ExecutionResult:
        """Executes an authorized recovery action and returns an ExecutionResult."""
        pass

    @abstractmethod
    def get_status(self, execution_id: str) -> ExecutionResult:
        """Queries provider status for an existing execution."""
        pass

    @abstractmethod
    def supports(self, action_type: ActionType) -> bool:
        """Returns True if this provider supports the given action type."""
        pass

    @abstractmethod
    def provider_name(self) -> str:
        """Returns the canonical provider name string."""
        pass

    # Backward compatibility method for existing Phase 1C/1F callers
    def execute(
        self,
        execution: RecoveryExecution,
        payment: Payment,
        scenario: SimulationScenario = SimulationScenario.CONTEXT_AWARE,
    ) -> RecoveryOutcome:
        if not isinstance(execution, RecoveryExecution):
            raise PolicyApprovalRequiredError(
                f"Execution provider accepts ONLY authorized RecoveryExecution instances. Received: {type(execution).__name__}"
            )
        executor = SimulatedRecoveryExecutor()
        return executor.execute(execution, payment, scenario)
