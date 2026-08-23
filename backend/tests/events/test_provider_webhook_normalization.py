import pytest
from app.events.normalizer import get_webhook_normalizer, EventType


def test_razorpay_webhook_normalization():
    norm = get_webhook_normalizer("razorpay")
    raw = {
        "event": "payment.captured",
        "event_id": "evt_rzp_test_100",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_100",
                    "customer_id": "cust_100",
                    "amount": 5000,
                    "currency": "INR",
                    "status": "captured",
                }
            }
        },
    }
    res = norm.normalize(raw, correlation_id="corr_wh_100")
    assert res is not None
    assert res.provider == "razorpay"
    assert res.provider_event_id == "evt_rzp_test_100"
    assert res.normalized_event_type == EventType.RECOVERY_JOB_COMPLETED
    assert res.amount == 50.0
