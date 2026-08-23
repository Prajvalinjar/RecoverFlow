from typing import List, Optional, Any
from datetime import datetime, timedelta
import uuid

from app.domain.payment import Payment
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase
from app.domain.actions import ActionType

from app.intelligence.failure_classifier import FailureClassifier, FailureCategory
from app.intelligence.recovery_signals import RecoverySignals, UrgencyLevel
from app.intelligence.scoring import HeuristicRecoverabilityScorer, RecoverabilityLevel
from app.intelligence.opportunity import RecoveryOpportunity, ActionabilityState


class RecoveryOpportunityDetector:
    """Deterministic Recovery Opportunity Detector.
    
    Transforms payment failure context and customer history into structured, explainable 
    RecoveryOpportunity domain models. 100% reproducible with zero side effects or external calls.
    """

    def __init__(
        self,
        classifier: Optional[FailureClassifier] = None,
        scorer: Optional[HeuristicRecoverabilityScorer] = None,
        cooldown_seconds: int = 300,
    ) -> None:
        self.classifier = classifier or FailureClassifier()
        self.scorer = scorer or HeuristicRecoverabilityScorer()
        self.cooldown_seconds = cooldown_seconds

    def detect(
        self,
        payment: Payment,
        customer: CustomerContext,
        case: RecoveryCase,
        historical_attempts: Optional[List[Any]] = None,
        previous_outcomes: Optional[List[Any]] = None,
        evaluation_time: Optional[datetime] = None,
    ) -> RecoveryOpportunity:
        now = evaluation_time or datetime.now()
        attempts = historical_attempts or []
        outcomes = previous_outcomes or []

        # 1. Failure Classification
        classification = self.classifier.classify(payment)

        # 2. Cooldown Status Check
        cooldown_satisfied = True
        time_since_failure = 0.0
        if case.last_attempt_at is not None:
            elapsed_sec = (now - case.last_attempt_at).total_seconds()
            time_since_failure = elapsed_sec / 60.0
            if elapsed_sec < self.cooldown_seconds:
                cooldown_satisfied = False

        # 3. Urgency Assessment
        urgency = UrgencyLevel.MEDIUM
        if payment.amount > 50000:
            urgency = UrgencyLevel.HIGH
        if classification.category == FailureCategory.TEMPORARY:
            urgency = UrgencyLevel.HIGH if cooldown_satisfied else UrgencyLevel.MEDIUM

        # 4. Signal Extraction
        total_customer_attempts = customer.historical_success_count + customer.historical_failure_count
        hist_success_rate = (
            customer.historical_success_count / total_customer_attempts if total_customer_attempts > 0 else 0.0
        )

        signals = RecoverySignals(
            failure_category=classification.category,
            failure_severity=classification.severity,
            retry_attempt_count=case.attempts_count,
            max_allowed_retries=case.max_allowed_attempts,
            customer_historical_success_rate=hist_success_rate,
            customer_success_count=customer.historical_success_count,
            customer_failure_count=customer.historical_failure_count,
            previous_recovery_success_rate=customer.previous_recovery_success_rate,
            average_payment_delay_hours=customer.average_payment_delay_hours,
            payment_amount=payment.amount,
            time_since_failure_minutes=time_since_failure,
            cooldown_satisfied=cooldown_satisfied,
            customer_reliability_segment=customer.customer_segment,
            urgency=urgency,
        )

        # 5. Recoverability Assessment
        assessment = self.scorer.evaluate(signals, is_terminal_case=case.is_terminal())

        # 6. Actionability / Readiness Assessment
        if case.is_terminal() or signals.retries_exhausted:
            actionability = ActionabilityState.DO_NOT_ACT
        elif not cooldown_satisfied:
            actionability = ActionabilityState.WAIT
        elif assessment.level == RecoverabilityLevel.NOT_RECOMMENDED:
            actionability = ActionabilityState.DO_NOT_ACT
        else:
            actionability = ActionabilityState.READY

        # 7. Candidate Action Types Identification
        candidate_actions: List[ActionType] = []
        if actionability != ActionabilityState.DO_NOT_ACT:
            if classification.category == FailureCategory.TEMPORARY:
                candidate_actions = [ActionType.RETRY_IMMEDIATE, ActionType.RETRY_AFTER_DELAY]
            elif classification.category == FailureCategory.LIMIT_OR_FUNDS:
                candidate_actions = [ActionType.RETRY_AFTER_DELAY, ActionType.SEND_PAYMENT_REMINDER]
            elif classification.category == FailureCategory.PAYMENT_METHOD_ISSUE:
                candidate_actions = [ActionType.SEND_PAYMENT_LINK, ActionType.ESCALATE_TO_MERCHANT]
            elif classification.category == FailureCategory.AUTHENTICATION_REQUIRED:
                candidate_actions = [ActionType.SEND_PAYMENT_REMINDER, ActionType.SEND_PAYMENT_LINK]
            else:
                candidate_actions = [ActionType.RETRY_AFTER_DELAY, ActionType.STOP_RECOVERY]

            if ActionType.STOP_RECOVERY not in candidate_actions:
                candidate_actions.append(ActionType.STOP_RECOVERY)

        return RecoveryOpportunity(
            opportunity_id=f"opp_{uuid.uuid4().hex[:12]}",
            case_id=case.case_id,
            payment_id=payment.payment_id,
            recoverability_level=assessment.level,
            recoverability_score=assessment.score,
            primary_reason=assessment.primary_reason,
            supporting_signals=assessment.supporting_signals,
            risk_factors=assessment.risk_factors,
            urgency=urgency,
            actionability=actionability,
            candidate_action_types=candidate_actions,
            detected_at=now,
        )
