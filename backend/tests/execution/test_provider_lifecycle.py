import pytest
from app.execution.lifecycle import lifecycle_manager, ProviderLifecycleState


def test_provider_lifecycle_state_transitions():
    lifecycle_manager.reset()
    info = lifecycle_manager.update_state("razorpay", ProviderLifecycleState.DEGRADED)
    assert info.state == ProviderLifecycleState.DEGRADED

    avail = lifecycle_manager.is_available("razorpay")
    assert avail is True  # DEGRADED is still available for traffic

    info = lifecycle_manager.update_state("razorpay", ProviderLifecycleState.UNAVAILABLE)
    assert info.state == ProviderLifecycleState.UNAVAILABLE
    assert lifecycle_manager.is_available("razorpay") is False


def test_deterministic_fallback_protection():
    lifecycle_manager.reset()
    # Razorpay available -> stays razorpay
    choice = lifecycle_manager.evaluate_fallback("razorpay", "simulated")
    assert choice == "razorpay"

    # Razorpay unavailable -> fallback to simulated
    lifecycle_manager.update_state("razorpay", ProviderLifecycleState.UNAVAILABLE)
    choice = lifecycle_manager.evaluate_fallback("razorpay", "simulated")
    assert choice == "simulated"
