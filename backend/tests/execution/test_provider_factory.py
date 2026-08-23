import pytest
from app.execution.provider_config import ProviderConfig, ProviderConfigurationError
from app.execution.provider_factory import get_active_provider


def test_provider_factory_simulated_and_razorpay() -> None:
    p_sim = get_active_provider(ProviderConfig(provider_type="simulated"))
    assert p_sim.provider_name() == "SIMULATED_PROVIDER"

    p_rzp = get_active_provider(ProviderConfig(provider_type="razorpay", environment="test"))
    assert p_rzp.provider_name() == "razorpay"


def test_provider_factory_unknown_provider() -> None:
    with pytest.raises(ProviderConfigurationError):
        get_active_provider(ProviderConfig(provider_type="invalid_type"))
