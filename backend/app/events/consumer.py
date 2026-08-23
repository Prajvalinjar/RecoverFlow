from typing import Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.repository.models import EventProcessingRecordModel
from app.observability.telemetry import telemetry_registry


@dataclass(frozen=True)
class EventProcessingRecord:
    id: str
    event_id: str
    event_type: str
    consumer_name: str
    status: str = "PROCESSED"
    correlation_id: Optional[str] = None
    processed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class EventConsumerIdempotencyService:
    """Production-grade event consumer idempotency guard.

    Ensures that (event_id, consumer_name) cannot be processed twice successfully.
    """

    def __init__(self, session: Session) -> None:
        self.session = session

    def _to_domain(self, model: EventProcessingRecordModel) -> EventProcessingRecord:
        return EventProcessingRecord(
            id=model.id,
            event_id=model.event_id,
            event_type=model.event_type,
            consumer_name=model.consumer_name,
            status=model.status or "PROCESSED",
            correlation_id=model.correlation_id,
            processed_at=model.processed_at or datetime.now(timezone.utc),
        )

    def is_already_processed(self, event_id: str, consumer_name: str) -> bool:
        model = self.session.query(EventProcessingRecordModel).filter(
            EventProcessingRecordModel.event_id == event_id,
            EventProcessingRecordModel.consumer_name == consumer_name,
        ).first()
        return model is not None

    def record_processed(
        self,
        event_id: str,
        consumer_name: str,
        event_type: str,
        correlation_id: Optional[str] = None,
    ) -> Tuple[bool, EventProcessingRecord]:
        """Atomically checks and records event consumer processing.

        Returns:
            (is_duplicate, record)
        """
        existing = self.session.query(EventProcessingRecordModel).filter(
            EventProcessingRecordModel.event_id == event_id,
            EventProcessingRecordModel.consumer_name == consumer_name,
        ).first()

        if existing:
            telemetry_registry.increment("events.duplicate")
            return True, self._to_domain(existing)

        rec_id = f"rec_evt_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        model = EventProcessingRecordModel(
            id=rec_id,
            event_id=event_id,
            event_type=event_type,
            consumer_name=consumer_name,
            status="PROCESSED",
            correlation_id=correlation_id,
            processed_at=now,
        )
        try:
            self.session.add(model)
            self.session.commit()
            return False, self._to_domain(model)
        except IntegrityError:
            self.session.rollback()
            dup = self.session.query(EventProcessingRecordModel).filter(
                EventProcessingRecordModel.event_id == event_id,
                EventProcessingRecordModel.consumer_name == consumer_name,
            ).first()
            telemetry_registry.increment("events.duplicate")
            return True, self._to_domain(dup)
