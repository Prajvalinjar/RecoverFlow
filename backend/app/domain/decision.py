from typing import List
from dataclasses import dataclass, field
from datetime import datetime
from app.domain.actions import CandidateRecoveryAction


@dataclass(frozen=True)
class AgentDecision:
    decision_id: str
    case_id: str
    recommended_action: CandidateRecoveryAction
    confidence: float  # Must be strictly between 0.0 and 1.0
    rationale: str
    contributing_factors: List[str] = field(default_factory=list)
    alternative_actions: List[CandidateRecoveryAction] = field(default_factory=list)
    model_version: str = "prototype-v1.0"
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self) -> None:
        if not (0.0 <= self.confidence <= 1.0):
            raise ValueError(f"Confidence score {self.confidence} must be between 0.0 and 1.0.")
        if not self.rationale.strip():
            raise ValueError("Rationale cannot be empty.")
