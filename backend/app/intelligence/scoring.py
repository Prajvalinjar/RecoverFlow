from enum import Enum
from typing import List
from dataclasses import dataclass, field
from decimal import Decimal

from app.intelligence.failure_classifier import FailureCategory
from app.intelligence.recovery_signals import RecoverySignals


class RecoverabilityLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    NOT_RECOMMENDED = "NOT_RECOMMENDED"


@dataclass(frozen=True)
class RecoverabilityAssessment:
    """Deterministic assessment of payment recoverability based on evidence signals.
    
    Note: The numeric score is a deterministic heuristic indicator (0.0 to 100.0) 
    reflecting evidence strength. It is NOT a machine-learning probability or AI confidence metric.
    """
    level: RecoverabilityLevel
    score: float  # Deterministic heuristic score (0.0 - 100.0)
    primary_reason: str
    supporting_signals: List[str] = field(default_factory=list)
    risk_factors: List[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not (0.0 <= self.score <= 100.0):
            raise ValueError(f"Recoverability score {self.score} must be between 0.0 and 100.0.")


class HeuristicRecoverabilityScorer:
    """Centralized deterministic scoring engine for evaluating payment recoverability signals."""

    # Documented scoring adjustments
    BASE_SCORE = 50.0

    CATEGORY_WEIGHTS = {
        FailureCategory.TEMPORARY: 25.0,
        FailureCategory.LIMIT_OR_FUNDS: 10.0,
        FailureCategory.AUTHENTICATION_REQUIRED: 5.0,
        FailureCategory.SYSTEM_OR_PROCESSING: 15.0,
        FailureCategory.PAYMENT_METHOD_ISSUE: -10.0,
        FailureCategory.UNKNOWN: 0.0,
    }

    def evaluate(self, signals: RecoverySignals, is_terminal_case: bool = False) -> RecoverabilityAssessment:
        supporting_signals: List[str] = []
        risk_factors: List[str] = []

        # Hard Stop Condition: Exhausted retries or terminal case state
        if is_terminal_case or signals.retries_exhausted:
            if is_terminal_case:
                reason = "Recovery case is in a terminal state (RECOVERED, ESCALATED, or STOPPED)."
            else:
                reason = f"Retry attempts exhausted ({signals.retry_attempt_count}/{signals.max_allowed_retries})."
            risk_factors.append(reason)
            return RecoverabilityAssessment(
                level=RecoverabilityLevel.NOT_RECOMMENDED,
                score=0.0,
                primary_reason=reason,
                supporting_signals=supporting_signals,
                risk_factors=risk_factors,
            )

        score = self.BASE_SCORE

        # 1. Failure Category Adjustment
        cat_adj = self.CATEGORY_WEIGHTS.get(signals.failure_category, 0.0)
        score += cat_adj
        if cat_adj > 0:
            supporting_signals.append(f"Failure category '{signals.failure_category.value}' has high resolution potential (+{cat_adj:.0f}).")
        elif cat_adj < 0:
            risk_factors.append(f"Failure category '{signals.failure_category.value}' requires customer intervention ({cat_adj:.0f}).")

        # 2. Customer Historical Reliability Adjustment
        if signals.customer_success_count > 0 or signals.customer_failure_count > 0:
            total_history = signals.customer_success_count + signals.customer_failure_count
            success_rate = signals.customer_success_count / total_history if total_history > 0 else 0.0
            if success_rate >= 0.8 and signals.customer_success_count >= 3:
                score += 15.0
                supporting_signals.append(f"Strong customer payment history ({signals.customer_success_count} successful payments, {success_rate*100:.0f}% rate).")
            elif success_rate < 0.5 and total_history >= 3:
                score -= 15.0
                risk_factors.append(f"Low customer payment success rate ({success_rate*100:.0f}% historical rate).")

        # 3. Previous Attempts Penalty
        if signals.retry_attempt_count == 0:
            score += 10.0
            supporting_signals.append("First payment failure attempt; no previous retries used.")
        elif signals.retry_attempt_count == 1:
            score -= 10.0
            risk_factors.append("One retry attempt already executed.")
        elif signals.retry_attempt_count >= 2:
            score -= 25.0
            risk_factors.append(f"Multiple previous retries executed ({signals.retry_attempt_count}).")

        # 4. Monetary Amount Risk Adjustment
        if signals.payment_amount > Decimal("50000.00"):
            score -= 10.0
            risk_factors.append(f"High risk payment amount ({signals.payment_amount} INR).")
        elif signals.payment_amount <= Decimal("10000.00"):
            score += 5.0
            supporting_signals.append(f"Standard risk payment amount ({signals.payment_amount} INR).")

        # Clamp score between 0.0 and 100.0
        final_score = max(0.0, min(100.0, score))

        # Level Mapping
        if final_score >= 70.0:
            level = RecoverabilityLevel.HIGH
            primary_reason = f"High recoverability ({final_score:.1f}/100): Temporary failure with strong customer history."
        elif final_score >= 45.0:
            level = RecoverabilityLevel.MEDIUM
            primary_reason = f"Moderate recoverability ({final_score:.1f}/100): Potential recovery with contextual intervention."
        elif final_score > 15.0:
            level = RecoverabilityLevel.LOW
            primary_reason = f"Low recoverability ({final_score:.1f}/100): Multiple risk factors present."
        else:
            level = RecoverabilityLevel.NOT_RECOMMENDED
            primary_reason = f"Recovery not recommended ({final_score:.1f}/100): Excessive failure signals."

        return RecoverabilityAssessment(
            level=level,
            score=final_score,
            primary_reason=primary_reason,
            supporting_signals=supporting_signals,
            risk_factors=risk_factors,
        )
