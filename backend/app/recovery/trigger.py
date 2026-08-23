from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class RecoveryTrigger:
    """Trigger payload signaling that a recovery case is ready for autonomous recovery evaluation."""
    case_id: str
    payment_id: str
    event_id: Optional[str] = None
    trigger_reason: str = "Payment Failure Ingestion"
    triggered_at: datetime = field(default_factory=datetime.utcnow)
