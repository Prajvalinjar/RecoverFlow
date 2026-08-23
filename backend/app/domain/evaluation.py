from decimal import Decimal
from dataclasses import dataclass
from typing import List

from app.domain.outcome import RecoveryOutcome, OutcomeStatus
from app.domain.policy import PolicyDecision


@dataclass(frozen=True)
class RecoveryMetrics:
    """Aggregated metrics evaluation contract for track performance monitoring."""
    total_cases: int
    total_amount_at_risk: Decimal
    total_amount_recovered: Decimal
    policy_rejection_count: int

    @property
    def recovery_rate(self) -> float:
        if self.total_amount_at_risk == Decimal("0"):
            return 0.0
        return float(self.total_amount_recovered / self.total_amount_at_risk)

    @property
    def policy_rejection_rate(self) -> float:
        if self.total_cases == 0:
            return 0.0
        return float(self.policy_rejection_count / self.total_cases)


@dataclass(frozen=True)
class CaseEvaluation:
    """Evaluation summary for an individual recovery case."""
    case_id: str
    amount_at_risk: Decimal
    amount_recovered: Decimal
    is_recovered: bool
    total_attempts: int
    policy_rejections: int
