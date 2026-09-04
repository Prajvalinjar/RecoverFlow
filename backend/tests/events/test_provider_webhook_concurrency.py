import pytest
import concurrent.futures
from datetime import datetime, timezone
from decimal import Decimal
from app.events.processor import PaymentEventProcessor, AuthenticatedEventContext
from app.api.schemas.events import PaymentFailureEvent
from app.database.connection import SessionLocal


def process_event_worker(event_data, sec_ctx_data):
    session = SessionLocal()
    try:
        processor = PaymentEventProcessor(session)
        event = PaymentFailureEvent(**event_data)
        sec_ctx = AuthenticatedEventContext(**sec_ctx_data)
        res = processor.process_event(event, trigger_recovery=False, security_context=sec_ctx)
        return res.status, res.duplicate
    finally:
        session.close()


import uuid


def test_concurrent_duplicate_webhooks():
    uid = uuid.uuid4().hex[:8]
    event_id = f"evt_conc_{uid}"
    event_data = {
        "event_id": event_id,
        "event_type": "PAYMENT_FAILURE_RECEIVED",
        "payment_id": f"pay_conc_{uid}",
        "customer_id": f"cust_conc_{uid}",
        "amount": Decimal("250.00"),
        "currency": "INR",
        "failure_code": "INSUFFICIENT_FUNDS",
        "occurred_at": datetime.now(timezone.utc),
    }
    sec_ctx_data = {
        "provider": "razorpay",
        "event_id": event_id,
        "authenticated": True,
        "correlation_id": f"corr_conc_{uid}",
    }

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(process_event_worker, event_data, sec_ctx_data)
            for _ in range(3)
        ]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    statuses = [r[0] for r in results]
    duplicates = [r[1] for r in results]

    # Exactly one request should succeed (status="accepted", duplicate=False)
    assert statuses.count("accepted") == 1
    assert duplicates.count(False) == 1
    assert statuses.count("already_processed") == 2
