from typing import List, Optional, Any, Dict
from decimal import Decimal
from dataclasses import dataclass, field
from datetime import datetime

from app.domain.payment import Payment
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.actions import ActionType
from app.domain.decision import AgentDecision
from app.domain.agent import AgentInterface, PrototypeRecoveryAgent
from app.domain.policy import PolicyEvaluationContext, PolicyDecision, DeterministicPolicyEngine
from app.domain.orchestrator import RecoveryOrchestrator
from app.domain.execution import RecoveryExecution
from app.domain.outcome import RecoveryOutcome, OutcomeStatus
from app.domain.evaluation import CaseEvaluation
from app.domain.audit import AuditTrail, AuditEventType, AuditEvent

from app.intelligence.detector import RecoveryOpportunityDetector
from app.intelligence.opportunity import RecoveryOpportunity, ActionabilityState
from app.simulation.executor import SimulatedRecoveryExecutor
from app.simulation.scenarios import SimulationScenario, SimulationConfig


@dataclass
class RecoveryCycleResult:
    """Structured result container capturing the output of a single recovery cycle."""
    case_id: str
    cycle_number: int
    opportunity: Optional[RecoveryOpportunity] = None
    agent_decision: Optional[AgentDecision] = None
    policy_decision: Optional[PolicyDecision] = None
    execution: Optional[RecoveryExecution] = None
    outcome: Optional[RecoveryOutcome] = None
    evaluation: Optional[CaseEvaluation] = None
    case_state: CaseState = CaseState.DETECTED
    is_terminal: bool = False
    action_executed: bool = False
    rejection_reason: Optional[str] = None
    stop_reason: Optional[str] = None


@dataclass
class AutonomousRecoveryResult:
    """Complete multi-cycle autonomous recovery execution result and audit log."""
    case_id: str
    final_case: RecoveryCase
    payment: Payment
    customer: CustomerContext
    cycles: List[RecoveryCycleResult]
    audit_events: List[AuditEvent]
    overall_evaluation: CaseEvaluation
    is_recovered: bool
    total_cycles: int
    stop_reason: str


class RecoveryLoopService:
    """Service coordinating the complete end-to-end autonomous recovery lifecycle.
    
    Orchestrates:
    1. Recovery Intelligence Opportunity Detection
    2. AI Agent Reasoning Recommendation
    3. Deterministic Policy Safety Engine Evaluation
    4. RecoveryOrchestrator Authorized Execution Contract Dispatch
    5. SimulatedRecoveryExecutor Deterministic Execution
    6. Outcome Recording & Case Evaluation
    7. Complete Immutable Audit Trail Logging
    8. Context updating for multi-step bounded recovery cycles
    """

    def __init__(
        self,
        detector: Optional[RecoveryOpportunityDetector] = None,
        agent: Optional[AgentInterface] = None,
        policy_engine: Optional[DeterministicPolicyEngine] = None,
        orchestrator: Optional[RecoveryOrchestrator] = None,
        executor: Optional[SimulatedRecoveryExecutor] = None,
        audit_trail: Optional[AuditTrail] = None,
    ) -> None:
        self.detector = detector or RecoveryOpportunityDetector()
        self.agent = agent or PrototypeRecoveryAgent()
        self.policy_engine = policy_engine or DeterministicPolicyEngine()
        self.orchestrator = orchestrator or RecoveryOrchestrator()
        self.executor = executor or SimulatedRecoveryExecutor()
        self.audit_trail = audit_trail or AuditTrail()

    def process_recovery_cycle(
        self,
        case: RecoveryCase,
        payment: Payment,
        customer: CustomerContext,
        historical_attempts: Optional[List[Any]] = None,
        previous_outcomes: Optional[List[Any]] = None,
        cycle_number: int = 1,
        simulation_scenario: Optional[SimulationScenario | SimulationConfig] = None,
    ) -> RecoveryCycleResult:
        """Executes a single end-to-end recovery cycle with strict safety enforcement."""
        historical_attempts = historical_attempts or []
        previous_outcomes = previous_outcomes or []

        # 1. Terminal state check
        if case.is_terminal():
            return RecoveryCycleResult(
                case_id=case.case_id,
                cycle_number=cycle_number,
                case_state=case.state,
                is_terminal=True,
                action_executed=False,
                stop_reason="CASE_TERMINAL",
            )

        # Record initial case detection audit event if first cycle
        if cycle_number == 1 and not self.audit_trail.get_events_for_case(case.case_id):
            self.audit_trail.record(
                case_id=case.case_id,
                event_type=AuditEventType.CASE_DETECTED,
                actor="System",
                details={
                    "payment_id": payment.payment_id,
                    "customer_id": customer.customer_id,
                    "amount_at_risk": str(case.amount_at_risk),
                    "failure_code": payment.failure_code.value if payment.failure_code else "UNKNOWN",
                },
            )

        # 2. Intelligence: Opportunity Detection
        case.transition_to(CaseState.ANALYZING)
        eval_time: Optional[datetime] = None
        if cycle_number > 1 and case.last_attempt_at is not None:
            from datetime import timedelta
            eval_time = max(datetime.now(), case.last_attempt_at + timedelta(seconds=self.detector.cooldown_seconds + 1))

        opportunity = self.detector.detect(
            payment=payment,
            customer=customer,
            case=case,
            historical_attempts=historical_attempts,
            previous_outcomes=previous_outcomes,
            evaluation_time=eval_time,
        )
        self.audit_trail.record(
            case_id=case.case_id,
            event_type=AuditEventType.OPPORTUNITY_DETECTED,
            actor="RecoveryIntelligence",
            details={
                "opportunity_id": opportunity.opportunity_id,
                "recoverability_level": opportunity.recoverability_level.value,
                "recoverability_score": opportunity.recoverability_score,
                "actionability": opportunity.actionability.value,
                "urgency": opportunity.urgency.value,
            },
        )


        # Check for COOLDOWN_WAIT actionability
        if opportunity.actionability == ActionabilityState.WAIT:
            evaluation = CaseEvaluation(
                case_id=case.case_id,
                amount_at_risk=case.amount_at_risk,
                amount_recovered=Decimal("0.00"),
                is_recovered=False,
                total_attempts=case.attempts_count,
                policy_rejections=0,
            )
            return RecoveryCycleResult(
                case_id=case.case_id,
                cycle_number=cycle_number,
                opportunity=opportunity,
                evaluation=evaluation,
                case_state=case.state,
                is_terminal=case.is_terminal(),
                action_executed=False,
                stop_reason="COOLDOWN_WAIT",
            )

        # 3. AI Agent: Recommendation Generation
        self.audit_trail.record(
            case_id=case.case_id,
            event_type=AuditEventType.AGENT_ANALYSIS_STARTED,
            actor="Agent",
            details={"cycle_number": cycle_number},
        )
        agent_decision = self.agent.recommend(
            case=case,
            payment=payment,
            customer=customer,
            historical_attempts=historical_attempts,
            previous_outcomes=previous_outcomes,
            opportunity=opportunity,
        )
        self.audit_trail.record(
            case_id=case.case_id,
            event_type=AuditEventType.AGENT_DECISION_CREATED,
            actor="Agent",
            details={
                "decision_id": agent_decision.decision_id,
                "recommended_action": agent_decision.recommended_action.action_type.value,
                "confidence": agent_decision.confidence,
                "rationale": agent_decision.rationale,
            },
        )

        # 4. Deterministic Policy Evaluation
        policy_context = PolicyEvaluationContext(
            case=case,
            payment=payment,
            customer=customer,
            agent_decision=agent_decision,
            historical_attempts=historical_attempts,
            previous_outcomes=previous_outcomes,
        )
        policy_decision = self.policy_engine.evaluate(policy_context)
        self.audit_trail.record(
            case_id=case.case_id,
            event_type=AuditEventType.POLICY_EVALUATED,
            actor="PolicyEngine",
            details={
                "policy_decision_id": policy_decision.policy_decision_id,
                "allowed": policy_decision.allowed,
                "rejection_reason": policy_decision.rejection_reason,
                "rules_evaluated": policy_decision.rules_evaluated,
            },
        )

        # Handle Policy Rejection
        if not policy_decision.allowed:
            self.audit_trail.record(
                case_id=case.case_id,
                event_type=AuditEventType.ACTION_REJECTED,
                actor="PolicyEngine",
                details={"reason": policy_decision.rejection_reason},
            )
            # If retry limit reached or terminal rule triggered, transition to STOPPED
            if "Maximum retry attempts limit" in (policy_decision.rejection_reason or ""):
                case.transition_to(CaseState.STOPPED)
                self.audit_trail.record(case.case_id, AuditEventType.CASE_STOPPED, "PolicyEngine", {"reason": "Retry limit reached"})

            evaluation = CaseEvaluation(
                case_id=case.case_id,
                amount_at_risk=case.amount_at_risk,
                amount_recovered=Decimal("0.00"),
                is_recovered=False,
                total_attempts=case.attempts_count,
                policy_rejections=1,
            )
            return RecoveryCycleResult(
                case_id=case.case_id,
                cycle_number=cycle_number,
                opportunity=opportunity,
                agent_decision=agent_decision,
                policy_decision=policy_decision,
                evaluation=evaluation,
                case_state=case.state,
                is_terminal=case.is_terminal(),
                action_executed=False,
                rejection_reason=policy_decision.rejection_reason,
                stop_reason="POLICY_REJECTED",
            )

        # Policy Approved
        self.audit_trail.record(
            case_id=case.case_id,
            event_type=AuditEventType.ACTION_APPROVED,
            actor="PolicyEngine",
            details={"action_type": policy_decision.action.action_type.value},
        )

        # Handle explicit STOP_RECOVERY or ESCALATE_TO_MERCHANT
        action_type = policy_decision.action.action_type
        if action_type == ActionType.STOP_RECOVERY:
            case.transition_to(CaseState.STOPPED)
            self.audit_trail.record(case.case_id, AuditEventType.CASE_STOPPED, "Orchestrator", {"reason": "Explicit stop approved"})
            evaluation = CaseEvaluation(
                case_id=case.case_id,
                amount_at_risk=case.amount_at_risk,
                amount_recovered=Decimal("0.00"),
                is_recovered=False,
                total_attempts=case.attempts_count,
                policy_rejections=0,
            )
            return RecoveryCycleResult(
                case_id=case.case_id,
                cycle_number=cycle_number,
                opportunity=opportunity,
                agent_decision=agent_decision,
                policy_decision=policy_decision,
                evaluation=evaluation,
                case_state=case.state,
                is_terminal=True,
                action_executed=False,
                stop_reason="EXPLICIT_STOP",
            )

        if action_type == ActionType.ESCALATE_TO_MERCHANT:
            case.transition_to(CaseState.ESCALATED)
            self.audit_trail.record(case.case_id, AuditEventType.CASE_ESCALATED, "Orchestrator", {"reason": "Escalated to merchant"})
            evaluation = CaseEvaluation(
                case_id=case.case_id,
                amount_at_risk=case.amount_at_risk,
                amount_recovered=Decimal("0.00"),
                is_recovered=False,
                total_attempts=case.attempts_count,
                policy_rejections=0,
            )
            return RecoveryCycleResult(
                case_id=case.case_id,
                cycle_number=cycle_number,
                opportunity=opportunity,
                agent_decision=agent_decision,
                policy_decision=policy_decision,
                evaluation=evaluation,
                case_state=case.state,
                is_terminal=True,
                action_executed=False,
                stop_reason="ESCALATED",
            )

        # 5. Dispatch Authorized Recovery Execution
        execution = self.orchestrator.dispatch(policy_decision, case)
        self.audit_trail.record(
            case_id=case.case_id,
            event_type=AuditEventType.EXECUTION_DISPATCHED,
            actor="Orchestrator",
            details={
                "execution_id": execution.execution_id,
                "idempotency_key": execution.idempotency_key,
                "action_type": execution.action.action_type.value,
            },
        )

        # 6. Simulated Recovery Execution
        outcome = self.executor.execute(execution, payment, simulation_scenario)
        self.audit_trail.record(
            case_id=case.case_id,
            event_type=AuditEventType.EXECUTION_COMPLETED,
            actor="SimulatedExecutor",
            details={"execution_id": execution.execution_id, "status": execution.status.value},
        )
        self.audit_trail.record(
            case_id=case.case_id,
            event_type=AuditEventType.OUTCOME_RECORDED,
            actor="OutcomeVerification",
            details={
                "outcome_id": outcome.outcome_id,
                "status": outcome.status.value,
                "recovered_amount": str(outcome.recovered_amount),
                "failure_reason": outcome.failure_reason,
            },
        )

        # Update case state based on outcome
        if outcome.status in (OutcomeStatus.RECOVERED, OutcomeStatus.PARTIALLY_RECOVERED):
            case.transition_to(CaseState.RECOVERED)
            self.audit_trail.record(
                case_id=case.case_id,
                event_type=AuditEventType.RECOVERY_SUCCEEDED,
                actor="System",
                details={"amount": str(outcome.recovered_amount)},
            )
        else:
            if case.attempts_count >= case.max_allowed_attempts:
                case.transition_to(CaseState.STOPPED)
                self.audit_trail.record(case.case_id, AuditEventType.CASE_STOPPED, "System", {"reason": "Retry limit reached after failure"})
            else:
                case.transition_to(CaseState.FAILED)
                self.audit_trail.record(
                    case_id=case.case_id,
                    event_type=AuditEventType.RECOVERY_FAILED,
                    actor="System",
                    details={"reason": outcome.failure_reason},
                )

        # 7. Case Evaluation
        evaluation = CaseEvaluation(
            case_id=case.case_id,
            amount_at_risk=case.amount_at_risk,
            amount_recovered=outcome.recovered_amount,
            is_recovered=(outcome.status == OutcomeStatus.RECOVERED),
            total_attempts=case.attempts_count,
            policy_rejections=0,
        )
        self.audit_trail.record(
            case_id=case.case_id,
            event_type=AuditEventType.CASE_EVALUATED,
            actor="EvaluationEngine",
            details={
                "is_recovered": evaluation.is_recovered,
                "amount_recovered": str(evaluation.amount_recovered),
                "total_attempts": evaluation.total_attempts,
            },
        )

        stop_reason = "PAYMENT_RECOVERED" if evaluation.is_recovered else ("CASE_TERMINAL" if case.is_terminal() else None)

        return RecoveryCycleResult(
            case_id=case.case_id,
            cycle_number=cycle_number,
            opportunity=opportunity,
            agent_decision=agent_decision,
            policy_decision=policy_decision,
            execution=execution,
            outcome=outcome,
            evaluation=evaluation,
            case_state=case.state,
            is_terminal=case.is_terminal(),
            action_executed=True,
            stop_reason=stop_reason,
        )

    def run_autonomous_recovery(
        self,
        case: RecoveryCase,
        payment: Payment,
        customer: CustomerContext,
        max_cycles: int = 3,
        simulation_scenario: Optional[SimulationScenario | SimulationConfig] = None,
    ) -> AutonomousRecoveryResult:
        """Runs a bounded multi-step autonomous recovery loop until recovery or stop condition."""
        cycles: List[RecoveryCycleResult] = []
        historical_attempts: List[Any] = []
        previous_outcomes: List[Any] = []

        stop_reason = "MAX_CYCLES_REACHED"

        if case.is_terminal():
            cycle_res = self.process_recovery_cycle(
                case=case,
                payment=payment,
                customer=customer,
                historical_attempts=historical_attempts,
                previous_outcomes=previous_outcomes,
                cycle_number=1,
                simulation_scenario=simulation_scenario,
            )
            cycles.append(cycle_res)
            stop_reason = "CASE_TERMINAL"

        while len(cycles) < max_cycles and not case.is_terminal():

            cycle_number = len(cycles) + 1
            cycle_res = self.process_recovery_cycle(
                case=case,
                payment=payment,
                customer=customer,
                historical_attempts=historical_attempts,
                previous_outcomes=previous_outcomes,
                cycle_number=cycle_number,
                simulation_scenario=simulation_scenario,
            )
            cycles.append(cycle_res)

            if cycle_res.execution:
                historical_attempts.append(cycle_res.execution)
            if cycle_res.outcome:
                previous_outcomes.append(cycle_res.outcome)

            if cycle_res.stop_reason:
                stop_reason = cycle_res.stop_reason
                break

            if not cycle_res.action_executed:
                stop_reason = cycle_res.stop_reason or "ACTION_NOT_EXECUTED"
                break

        # Calculate final overall evaluation
        total_recovered = Decimal("0.00")
        total_attempts = case.attempts_count
        policy_rejections = sum(1 for c in cycles if c.policy_decision and not c.policy_decision.allowed)
        is_recovered = case.state == CaseState.RECOVERED

        for c in cycles:
            if c.outcome and c.outcome.recovered_amount > 0:
                total_recovered = max(total_recovered, c.outcome.recovered_amount)

        overall_evaluation = CaseEvaluation(
            case_id=case.case_id,
            amount_at_risk=case.amount_at_risk,
            amount_recovered=total_recovered,
            is_recovered=is_recovered,
            total_attempts=total_attempts,
            policy_rejections=policy_rejections,
        )

        all_audit_events = self.audit_trail.get_events_for_case(case.case_id)

        return AutonomousRecoveryResult(
            case_id=case.case_id,
            final_case=case,
            payment=payment,
            customer=customer,
            cycles=cycles,
            audit_events=all_audit_events,
            overall_evaluation=overall_evaluation,
            is_recovered=is_recovered,
            total_cycles=len(cycles),
            stop_reason=stop_reason,
        )
