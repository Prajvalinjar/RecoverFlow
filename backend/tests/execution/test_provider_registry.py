import pytest
from app.execution.lifecycle import lifecycle_manager, ProviderLifecycleState
from app.execution.capabilities import capability_registry, ProviderCapability


def test_provider_registration_and_lookup():
    lifecycle_manager.reset()
    info = lifecycle_manager.get_provider_info("simulated")
    assert info is not None
    assert info.provider_name in ("simulated", "SIMULATED_PROVIDER")
    assert info.state == ProviderLifecycleState.AVAILABLE


def test_list_all_providers():
    lifecycle_manager.reset()
    providers = lifecycle_manager.list_providers()
    names = [p.provider_name for p in providers]
    assert "simulated" in names or "SIMULATED_PROVIDER" in names
    assert "razorpay" in names
