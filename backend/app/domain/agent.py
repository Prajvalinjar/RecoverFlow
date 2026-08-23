from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Dict, Any, TYPE_CHECKING
from dataclasses import dataclass, field
import uuid

from app.domain.payment import Payment, FailureCode
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.decision import AgentDecision

if TYPE_CHECKING:
    from app.intelligence.opportunity import RecoveryOpportunity


@dataclass
class AgentReasoningInput:
    """Contextual information container required for AI recovery reasoning."""
    case: RecoveryCase
    payment: Payment
    customer: CustomerContext
    historical_attempts: List[Any] = field(default_factory=list)
    previous_outcomes: List[Any] = field(default_factory=list)
    risk_signals: Dict[str, Any] = field(default_factory=dict)
    opportunity: RecoveryOpportunity | None = None


class AgentInterface(ABC):
    """Abstract interface defining the AI Agent reasoning lifecycle contract.
    
    The AI Agent is strictly responsible for:
    - Context understanding
    - Root-cause diagnosis
    - Candidate action generation
    - Candidate evaluation
    - Producing a structured recommendation with confidence & rationale
    
    The AI Agent has ZERO direct financial execution authority.
    """

    @abstractmethod
    def observe(
        self,
        case: RecoveryCase,
        payment: Payment,
        customer: CustomerContext,
        historical_attempts: List[Any] = None,
        previous_outcomes: List[Any] = None,
        risk_signals: Dict[str, Any] = None,
        opportunity: RecoveryOpportunity | None = None,
    ) -> AgentReasoningInput:
        """Assembles contextual reasoning input for the case."""
        pass

    @abstractmethod
    def diagnose(self, input_data: AgentReasoningInput) -> str:
        """Diagnoses the likely failure cause based on payment failure code and customer history."""
        pass

    @abstractmethod
    def generate_candidates(self, input_data: AgentReasoningInput) -> List[CandidateRecoveryAction]:
        """Generates candidate recovery interventions."""
        pass

    @abstractmethod
    def evaluate_candidates(
        self, candidates: List[CandidateRecoveryAction], input_data: AgentReasoningInput
    ) -> AgentDecision:
        """Evaluates candidate recovery actions and produces a structured recommendation."""
        pass

    @abstractmethod
    def recommend(
        self,
        case: RecoveryCase,
        payment: Payment,
        customer: CustomerContext,
        historical_attempts: List[Any] = None,
        previous_outcomes: List[Any] = None,
        risk_signals: Dict[str, Any] = None,
        opportunity: RecoveryOpportunity | None = None,
    ) -> AgentDecision:
        """Executes full reasoning lifecycle and returns a structured AgentDecision."""
        pass


class PrototypeRecoveryAgent(AgentInterface):
    """Deterministic prototype baseline used to validate the Agent interface before real model integration.
    
    This agent implements heuristic decision logic to validate system boundaries.
    It considers attempt history, previous outcomes, failure classification, recoverability,
    and risk signals to produce adaptive recommendations deterministically.
    """

    def observe(
        self,
        case: RecoveryCase,
        payment: Payment,
        customer: CustomerContext,
        historical_attempts: List[Any] = None,
        previous_outcomes: List[Any] = None,
        risk_signals: Dict[str, Any] = None,
        opportunity: RecoveryOpportunity | None = None,
    ) -> AgentReasoningInput:
        case.transition_to(CaseState.ANALYZING)
        return AgentReasoningInput(
            case=case,
            payment=payment,
            customer=customer,
            historical_attempts=historical_attempts or [],
            previous_outcomes=previous_outcomes or [],
            risk_signals=risk_signals or {},
            opportunity=opportunity,
        )

    def diagnose(self, input_data: AgentReasoningInput) -> str:
        if input_data.opportunity:
            return f"Intelligence Diagnosis: {input_data.opportunity.primary_reason}"

        code = input_data.payment.failure_code
        if code == FailureCode.INSUFFICIENT_FUNDS:
            if input_data.customer.historical_success_count > 3:
                return "Temporary liquidity deficit for historically reliable customer."
            return "Insufficient account balance on attempt."
        elif code == FailureCode.BANK_TIMEOUT:
            return "Intermittent banking gateway timeout."
        elif code == FailureCode.NETWORK_FAILURE:
            return "Transient network transport disruption."
        elif code == FailureCode.CARD_DECLINED:
            return "Issuer card decline requiring merchant or cardholder intervention."
        else:
            return "Payment failure detected requiring contextual intervention."

    def generate_candidates(self, input_data: AgentReasoningInput) -> List[CandidateRecoveryAction]:
        candidates: List[CandidateRecoveryAction] = []
        if input_data.opportunity and input_data.opportunity.candidate_action_types:
            for action_type in input_data.opportunity.candidate_action_types:
                if action_type == ActionType.RETRY_AFTER_DELAY:
                    candidates.append(CandidateRecoveryAction(action_type=action_type, delay_hours=6))
                else:
                    candidates.append(CandidateRecoveryAction(action_type=action_type))
        else:
            code = input_data.payment.failure_code
            if code == FailureCode.INSUFFICIENT_FUNDS:
                candidates.append(CandidateRecoveryAction(action_type=ActionType.RETRY_AFTER_DELAY, delay_hours=6))
                candidates.append(CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_REMINDER))
                candidates.append(CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK))
            elif code in (FailureCode.BANK_TIMEOUT, FailureCode.NETWORK_FAILURE):
                candidates.append(CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE))
                candidates.append(CandidateRecoveryAction(action_type=ActionType.RETRY_AFTER_DELAY, delay_hours=1))
                candidates.append(CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK))
            elif code == FailureCode.CARD_DECLINED:
                candidates.append(CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK))
                candidates.append(CandidateRecoveryAction(action_type=ActionType.ESCALATE_TO_MERCHANT))
            else:
                candidates.append(CandidateRecoveryAction(action_type=ActionType.RETRY_AFTER_DELAY, delay_hours=24))
                candidates.append(CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK))

        if not any(c.action_type == ActionType.STOP_RECOVERY for c in candidates):
            candidates.append(CandidateRecoveryAction(action_type=ActionType.STOP_RECOVERY))
        return candidates

    def evaluate_candidates(
        self, candidates: List[CandidateRecoveryAction], input_data: AgentReasoningInput
    ) -> AgentDecision:
        from app.intelligence.opportunity import ActionabilityState
        from app.domain.outcome import OutcomeStatus

        diagnosis = self.diagnose(input_data)
        case = input_data.case
        payment = input_data.payment
        customer = input_data.customer
        opportunity = input_data.opportunity

        selected_candidate: CandidateRecoveryAction | None = None
        rationale_override: str | None = None

        # 1. Multi-step history check (when previous_outcomes contains a failed attempt)
        if input_data.previous_outcomes:
            has_failed_retry = any(
                (getattr(out, "status", None) or (out.get("status") if isinstance(out, dict) else None))
                in ("NOT_RECOVERED", "FAILED", OutcomeStatus.NOT_RECOVERED, OutcomeStatus.FAILED)
                for out in input_data.previous_outcomes
            )
            if has_failed_retry:
                # Recommend alternative intervention (SEND_PAYMENT_LINK, SEND_PAYMENT_REMINDER, ESCALATE_TO_MERCHANT)
                for c in candidates:
                    if c.action_type in (
                        ActionType.SEND_PAYMENT_LINK,
                        ActionType.SEND_PAYMENT_REMINDER,
                        ActionType.ESCALATE_TO_MERCHANT,
                    ):
                        selected_candidate = c
                        break
                if selected_candidate:
                    rationale_override = (
                        f"Previous recovery attempt failed (attempts_count={case.attempts_count}). "
                        "The payment remains recoverable, but repeating the same retry is unlikely to add value. "
                        f"Recommending alternative action {selected_candidate.action_type.value} to engage customer directly."
                    )

        if not selected_candidate:
            selected_candidate = candidates[0]

        alternatives = [c for c in candidates if c != selected_candidate]

        confidence = 0.85
        if customer.historical_success_count > 5:
            confidence = 0.92
        if case.attempts_count > 0:
            confidence = max(0.60, confidence - 0.10 * case.attempts_count)

        contributing_factors = [
            f"Failure code: {payment.failure_code.value if payment.failure_code else 'UNKNOWN'}",
            f"Customer historical successes: {customer.historical_success_count}",
            f"Previous attempts: {case.attempts_count}",
        ]
        if opportunity:
            contributing_factors.append(f"Opportunity Recoverability: {opportunity.recoverability_level.value}")
            contributing_factors.append(f"Opportunity Score: {opportunity.recoverability_score:.1f}")
        if input_data.previous_outcomes:
            contributing_factors.append(f"Previous outcomes count: {len(input_data.previous_outcomes)}")

        rationale = rationale_override or f"Diagnosed: '{diagnosis}'. Recommended action {selected_candidate.action_type.value} based on customer history and context."

        decision = AgentDecision(
            decision_id=f"dec_{uuid.uuid4().hex[:12]}",
            case_id=case.case_id,
            recommended_action=selected_candidate,
            confidence=confidence,
            rationale=rationale,
            contributing_factors=contributing_factors,
            alternative_actions=alternatives,
            model_version="prototype-v1.0",
        )
        case.transition_to(CaseState.RECOMMENDATION_READY)
        return decision



    def recommend(
        self,
        case: RecoveryCase,
        payment: Payment,
        customer: CustomerContext,
        historical_attempts: List[Any] = None,
        previous_outcomes: List[Any] = None,
        risk_signals: Dict[str, Any] = None,
        opportunity: RecoveryOpportunity | None = None,
    ) -> AgentDecision:
        input_data = self.observe(
            case, payment, customer, historical_attempts, previous_outcomes, risk_signals, opportunity
        )
        candidates = self.generate_candidates(input_data)
        return self.evaluate_candidates(candidates, input_data)

