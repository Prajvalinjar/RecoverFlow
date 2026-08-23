import pytest
from app.execution.capabilities import capability_registry, ProviderCapability
from app.domain.actions import ActionType
from app.execution.razorpay import RazorpayExecutionProvider


def test_provider_capability_discovery():
    capability_registry.reset()
    rzp_caps = capability_registry.get_capabilities("razorpay")
    assert ProviderCapability.SEND_PAYMENT_LINK in rzp_caps
    assert ProviderCapability.RETRY_IMMEDIATE in rzp_caps
    assert ProviderCapability.SEND_PAYMENT_REMINDER not in rzp_caps


def test_unsupported_capability_rejection():
    capability_registry.reset()
    provider = RazorpayExecutionProvider()
    assert not provider.supports(ActionType.SEND_PAYMENT_REMINDER)
    assert provider.supports(ActionType.SEND_PAYMENT_LINK)
