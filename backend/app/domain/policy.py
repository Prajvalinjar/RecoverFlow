from decimal import Decimal
from typing import List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import uuid

from app.domain.payment import Payment
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.decision import AgentDecision


@dataclass(frozen=True)
class PolicyEvaluationContext:
    """Contextual evaluation container required for deterministic policy validation."""
    case: RecoveryCase
    payment: Payment
    customer: CustomerContext
    agent_decision: AgentDecision
    historical_attempts: List[Any] = field(default_factory=list)
    previous_outcomes: List[Any] = field(default_factory=list)
    current_time: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        if self.agent_decision.case_id != self.case.case_id:
            raise ValueError(
                f"AgentDecision case_id '{self.agent_decision.case_id}' does not match RecoveryCase case_id '{self.case.case_id}'."
            )
        if not (0.0 <= self.agent_decision.confidence <= 1.0):
            raise ValueError(f"AgentDecision confidence {self.agent_decision.confidence} must be between 0.0 and 1.0.")


@dataclass(frozen=True)
class PolicyDecision:
    """Result of deterministic policy engine evaluation."""
    policy_decision_id: str
    case_id: str
    decision_id: str
    action: CandidateRecoveryAction
    allowed: bool
    rejection_reason: Optional[str] = None
    rules_evaluated: List[str] = field(default_factory=list)
    evaluated_at: datetime = field(default_factory=datetime.now)


class DeterministicPolicyEngine:
    """Deterministic Policy Engine enforcing financial safety, retry bounds, cooldowns, and stopping rules."""

    def __init__(
        self,
        max_amount_threshold: Decimal = Decimal("100000.00"),
        min_cooldown_seconds: int = 300,  # 5 minutes minimum cooldown default
    ) -> None:
        self.max_amount_threshold = max_amount_threshold
        self.min_cooldown_seconds = min_cooldown_seconds

    def evaluate(self, context: PolicyEvaluationContext) -> PolicyDecision:
        case = context.case
        decision = context.agent_decision
        action = decision.recommended_action
        rules_evaluated: List[str] = []

        # Check Terminal State FIRST before modifying case state
        rules_evaluated.append("TerminalStateRule")
        if case.is_terminal():
            return PolicyDecision(
                policy_decision_id=f"pol_{uuid.uuid4().hex[:12]}",
                case_id=case.case_id,
                decision_id=decision.decision_id,
                action=action,
                allowed=False,
                rejection_reason=f"Recovery case is in terminal state '{case.state.value}'.",
                rules_evaluated=rules_evaluated,
                evaluated_at=context.current_time,
            )

        case.transition_to(CaseState.POLICY_REVIEW)

        # Rule 2: Always allow explicit STOP_RECOVERY
        rules_evaluated.append("ExplicitStopRule")
        if action.action_type == ActionType.STOP_RECOVERY:
            case.transition_to(CaseState.APPROVED)
            return PolicyDecision(
                policy_decision_id=f"pol_{uuid.uuid4().hex[:12]}",
                case_id=case.case_id,
                decision_id=decision.decision_id,
                action=action,
                allowed=True,
                rules_evaluated=rules_evaluated,
                evaluated_at=context.current_time,
            )

        # Rule 3: Retry Limit Check
        rules_evaluated.append("MaxRetryAttemptsRule")
        if action.action_type in (ActionType.RETRY_IMMEDIATE, ActionType.RETRY_AFTER_DELAY):
            if case.attempts_count >= case.max_allowed_attempts:
                return PolicyDecision(
                    policy_decision_id=f"pol_{uuid.uuid4().hex[:12]}",
                    case_id=case.case_id,
                    decision_id=decision.decision_id,
                    action=action,
                    allowed=False,
                    rejection_reason=f"Maximum retry attempts limit ({case.max_allowed_attempts}) reached.",
                    rules_evaluated=rules_evaluated,
                    evaluated_at=context.current_time,
                )

        # Rule 4: Cooldown Period Check
        rules_evaluated.append("CooldownRule")
        if action.action_type == ActionType.RETRY_IMMEDIATE:
            if case.last_attempt_at is not None:
                elapsed_seconds = (context.current_time - case.last_attempt_at).total_seconds()
                if elapsed_seconds < self.min_cooldown_seconds:
                    return PolicyDecision(
                        policy_decision_id=f"pol_{uuid.uuid4().hex[:12]}",
                        case_id=case.case_id,
                        decision_id=decision.decision_id,
                        action=action,
                        allowed=False,
                        rejection_reason=f"Cooldown period not satisfied ({elapsed_seconds:.0f}s elapsed < {self.min_cooldown_seconds}s required).",
                        rules_evaluated=rules_evaluated,
                        evaluated_at=context.current_time,
                    )

        # Rule 5: Monetary Risk Threshold Check
        rules_evaluated.append("MaxRiskAmountRule")
        if case.amount_at_risk > self.max_amount_threshold:
            if action.action_type in (ActionType.RETRY_IMMEDIATE, ActionType.RETRY_AFTER_DELAY):
                return PolicyDecision(
                    policy_decision_id=f"pol_{uuid.uuid4().hex[:12]}",
                    case_id=case.case_id,
                    decision_id=decision.decision_id,
                    action=action,
                    allowed=False,
                    rejection_reason=f"Risk amount ({case.amount_at_risk}) exceeds automated retry threshold ({self.max_amount_threshold}). Requires escalation.",
                    rules_evaluated=rules_evaluated,
                    evaluated_at=context.current_time,
                )

        # All deterministic rules passed
        case.transition_to(CaseState.APPROVED)
        return PolicyDecision(
            policy_decision_id=f"pol_{uuid.uuid4().hex[:12]}",
            case_id=case.case_id,
            decision_id=decision.decision_id,
            action=action,
            allowed=True,
            rules_evaluated=rules_evaluated,
            evaluated_at=context.current_time,
        )
