from typing import Any
import uuid
from datetime import datetime

from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.policy import PolicyDecision
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.decision import AgentDecision


class PolicyApprovalRequiredError(Exception):
    """Raised when an unapproved PolicyDecision or direct AgentDecision is submitted for execution."""
    pass


class RecoveryOrchestrator:
    """Strict deterministic execution boundary.
    
    Responsibilities:
    - Accepts ONLY an approved PolicyDecision (allowed == True)
    - Rejection of allowed == False policy decisions
    - Rejection of direct AgentDecision inputs
    - Generation of deterministic idempotency keys
    - Case execution state management
    - ZERO AI reasoning or policy override authority
    """

    def dispatch(self, policy_decision: Any, case: RecoveryCase) -> RecoveryExecution:
        """Dispatches an approved policy decision into a RecoveryExecution contract.
        
        Args:
            policy_decision: Must be a valid PolicyDecision instance with allowed == True.
            case: The RecoveryCase being processed.
            
        Raises:
            PolicyApprovalRequiredError: If input is a direct AgentDecision, or if PolicyDecision.allowed is False.
        """
        # Reject direct AgentDecision inputs
        if isinstance(policy_decision, AgentDecision):
            raise PolicyApprovalRequiredError(
                "Direct AgentDecision submitted to RecoveryOrchestrator. Actions must be evaluated and approved by PolicyEngine first."
            )

        # Reject non-PolicyDecision objects
        if not isinstance(policy_decision, PolicyDecision):
            raise PolicyApprovalRequiredError(
                f"Invalid execution authorization object: {type(policy_decision).__name__}. Expected approved PolicyDecision."
            )

        # Reject unapproved policy decisions
        if not policy_decision.allowed:
            raise PolicyApprovalRequiredError(
                f"Cannot execute unapproved PolicyDecision '{policy_decision.policy_decision_id}' "
                f"for case '{policy_decision.case_id}'. Rejection reason: {policy_decision.rejection_reason}"
            )

        # Increment attempts count on case
        case.attempts_count += 1
        case.last_attempt_at = datetime.now()
        case.transition_to(CaseState.EXECUTING)

        # Generate deterministic idempotency key
        idempotency_key = f"rec_{case.case_id}_{policy_decision.action.action_type.value}_{case.attempts_count}"

        return RecoveryExecution(
            execution_id=f"exec_{uuid.uuid4().hex[:12]}",
            case_id=case.case_id,
            policy_decision_id=policy_decision.policy_decision_id,
            action=policy_decision.action,
            status=ExecutionStatus.DISPATCHED,
            idempotency_key=idempotency_key,
            started_at=datetime.now(),
        )
