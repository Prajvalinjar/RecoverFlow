from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import uuid


class EventType(str, Enum):
    PAYMENT_FAILURE_RECEIVED = "PAYMENT_FAILURE_RECEIVED"
    RECOVERY_JOB_CREATED = "RECOVERY_JOB_CREATED"
    RECOVERY_JOB_COMPLETED = "RECOVERY_JOB_COMPLETED"
    RECOVERY_JOB_FAILED = "RECOVERY_JOB_FAILED"
    RECOVERY_RETRY_SCHEDULED = "RECOVERY_RETRY_SCHEDULED"
    RECOVERY_CASE_RECOVERED = "RECOVERY_CASE_RECOVERED"
    RECOVERY_CASE_ESCALATED = "RECOVERY_CASE_ESCALATED"
    RECOVERY_CASE_STOPPED = "RECOVERY_CASE_STOPPED"
    RECONCILIATION_REQUIRED = "RECONCILIATION_REQUIRED"
    RECONCILIATION_COMPLETED = "RECONCILIATION_COMPLETED"


@dataclass(frozen=True)
class RecoveryEvent:
    """Immutable domain event payload passed through internal EventBus."""

    event_id: str = field(default_factory=lambda: f"evt_dom_{uuid.uuid4().hex[:12]}")
    event_type: EventType = EventType.PAYMENT_FAILURE_RECEIVED
    aggregate_id: str = ""
    case_id: str = ""
    payment_id: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    correlation_id: Optional[str] = None
