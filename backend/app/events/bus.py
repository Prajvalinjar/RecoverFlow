import logging
from typing import Dict, List, Callable, Optional, Any
from threading import Lock
from datetime import datetime, timezone
import json
import uuid

from app.events.event import RecoveryEvent, EventType
from app.observability.telemetry import telemetry_registry

logger = logging.getLogger("recoverflow.events.bus")

EventHandler = Callable[[RecoveryEvent], None]


class InMemoryEventBus:
    """Thread-safe, deterministic, in-process domain event bus.

    Serves as the internal event fan-out & decoupling mechanism.
    Does NOT introduce external daemon dependencies.
    """

    _instance = None
    _lock = Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(InMemoryEventBus, cls).__new__(cls)
                cls._instance._subscribers: Dict[EventType, List[EventHandler]] = {}
            return cls._instance

    def subscribe(self, event_type: EventType, handler: EventHandler) -> None:
        with self._lock:
            if event_type not in self._subscribers:
                self._subscribers[event_type] = []
            if handler not in self._subscribers[event_type]:
                self._subscribers[event_type].append(handler)

    def unsubscribe(self, event_type: EventType, handler: EventHandler) -> None:
        with self._lock:
            if event_type in self._subscribers and handler in self._subscribers[event_type]:
                self._subscribers[event_type].remove(handler)

    def publish(self, event: RecoveryEvent) -> int:
        """Publishes a domain event synchronously to all registered handlers."""
        with self._lock:
            handlers = list(self._subscribers.get(event.event_type, []))

        telemetry_registry.increment("events.published")
        delivered_count = 0

        for handler in handlers:
            try:
                handler(event)
                delivered_count += 1
                telemetry_registry.increment("events.consumed")
            except Exception as exc:
                logger.error("Error executing event handler for %s: %s", event.event_type.value, str(exc), exc_info=True)
                telemetry_registry.increment("events.failed")

        return delivered_count

    def clear_subscribers(self) -> None:
        with self._lock:
            self._subscribers.clear()


class EventPublisher:
    """Convenience wrapper for publishing RecoveryEvent objects through InMemoryEventBus."""

    def __init__(self, bus: Optional[InMemoryEventBus] = None) -> None:
        self.bus = bus or InMemoryEventBus()

    def publish_event(
        self,
        event_type: EventType,
        aggregate_id: str,
        case_id: str = "",
        payment_id: str = "",
        payload: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ) -> RecoveryEvent:
        evt = RecoveryEvent(
            event_id=f"evt_dom_{uuid.uuid4().hex[:12]}",
            event_type=event_type,
            aggregate_id=aggregate_id,
            case_id=case_id,
            payment_id=payment_id,
            payload=payload or {},
            timestamp=datetime.now(timezone.utc),
            correlation_id=correlation_id or f"corr_{uuid.uuid4().hex[:12]}",
        )
        self.bus.publish(evt)
        return evt
