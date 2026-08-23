import pytest
from app.execution.lifecycle import lifecycle_manager, ProviderLifecycleState
from app.execution.capabilities import capability_registry, ProviderCapability
from app.execution.errors import classify_provider_error, ProviderErrorCategory
from app.execution.provider_config import ProviderConfig
from app.events.normalizer import get_webhook_normalizer, EventType


def test_phase_2b_end_to_end_provider_integration():
    # 1. Provider Lifecycle & Discovery
    lifecycle_manager.reset()
    info = lifecycle_manager.get_provider_info("razorpay")
    assert info is not None
    assert info.provider_name == "razorpay"

    # 2. Capability Registry Verification
    assert capability_registry.supports("razorpay", ProviderCapability.SEND_PAYMENT_LINK)
    assert not capability_registry.supports("razorpay", ProviderCapability.SEND_PAYMENT_REMINDER)

    # 3. Error Normalization
    err = classify_provider_error("razorpay", code="RATE_LIMITED", http_code=429)
    assert err.category == ProviderErrorCategory.RATE_LIMITED
    assert err.retryable is True

    # 4. Safe Status Check
    cfg = ProviderConfig()
    status = cfg.safe_status()
    assert status["secrets_exposed"] is False

    # 5. Webhook Normalization
    normalizer = get_webhook_normalizer("razorpay")
    raw_payload = {
        "event": "payment_link.paid",
        "event_id": "evt_integ_500",
        "payload": {
            "payment_link": {
                "entity": {
                    "id": "plink_integ_500",
                    "customer_id": "cust_integ_500",
                    "amount": 2500,
                    "currency": "INR",
                }
            }
        },
    }
    norm = normalizer.normalize(raw_payload)
    assert norm is not None
    assert norm.provider == "razorpay"
    assert norm.normalized_event_type == EventType.RECOVERY_JOB_COMPLETED
    assert norm.amount == 25.0
