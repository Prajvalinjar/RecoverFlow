from typing import Dict, Optional
from app.domain.actions import ActionType
from app.domain.execution import RecoveryExecution
from app.domain.execution_result import ExecutionResult
from app.domain.orchestrator import PolicyApprovalRequiredError
from app.execution.provider import RecoveryExecutionProvider
from app.execution.simulated_provider import SimulatedExecutionProvider


class ExecutionProviderRouter:
    """Router selecting and dispatching authorized executions to registered providers.
    
    Guarantees that ONLY authorized RecoveryExecution instances pass to providers.
    Direct calls with AgentDecision, RecoveryOpportunity, or unapproved objects raise PolicyApprovalRequiredError.
    """

    def __init__(self) -> None:
        self._providers: Dict[str, RecoveryExecutionProvider] = {}
        # Register active provider via provider_factory
        from app.execution.provider_factory import get_active_provider
        active = get_active_provider()
        self.register(active)
        # Always register simulated provider as fallback
        if active.provider_name() != "simulated":
            self.register(SimulatedExecutionProvider())

    def register(self, provider: RecoveryExecutionProvider) -> None:
        self._providers[provider.provider_name()] = provider

    def resolve(self, action_type: ActionType) -> RecoveryExecutionProvider:
        for provider in self._providers.values():
            if provider.supports(action_type):
                return provider
        raise ValueError(f"No execution provider registered for action type: {action_type.value}")

    def execute(self, execution: RecoveryExecution) -> ExecutionResult:
        # Strict Execution Authorization Boundary check
        if not isinstance(execution, RecoveryExecution):
            raise PolicyApprovalRequiredError(
                f"ExecutionProviderRouter accepts ONLY authorized RecoveryExecution instances. Received unauthorized input: {type(execution).__name__}"
            )
        
        provider = self.resolve(execution.action.action_type)
        return provider.execute_action(execution)
