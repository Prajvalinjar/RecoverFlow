from enum import Enum
from typing import Dict, Any
from dataclasses import dataclass, field


class ActionType(str, Enum):
    RETRY_IMMEDIATE = "RETRY_IMMEDIATE"
    RETRY_AFTER_DELAY = "RETRY_AFTER_DELAY"
    SEND_PAYMENT_REMINDER = "SEND_PAYMENT_REMINDER"
    SEND_PAYMENT_LINK = "SEND_PAYMENT_LINK"
    ESCALATE_TO_MERCHANT = "ESCALATE_TO_MERCHANT"
    STOP_RECOVERY = "STOP_RECOVERY"


@dataclass(frozen=True)
class CandidateRecoveryAction:
    action_type: ActionType
    delay_hours: int = 0
    parameters: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.delay_hours < 0:
            raise ValueError("delay_hours cannot be negative.")
