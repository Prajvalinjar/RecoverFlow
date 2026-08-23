from app.events.event import RecoveryEvent, EventType
from app.events.bus import InMemoryEventBus, EventPublisher


def test_in_memory_event_bus_publish_and_subscribe() -> None:
    bus = InMemoryEventBus()
    received = []

    def handler(evt: RecoveryEvent) -> None:
        received.append(evt)

    bus.subscribe(EventType.PAYMENT_FAILURE_RECEIVED, handler)
    pub = EventPublisher(bus)
    pub.publish_event(EventType.PAYMENT_FAILURE_RECEIVED, aggregate_id="pay_eb_001", case_id="case_eb_001")

    assert len(received) == 1
    assert received[0].aggregate_id == "pay_eb_001"

    bus.unsubscribe(EventType.PAYMENT_FAILURE_RECEIVED, handler)
