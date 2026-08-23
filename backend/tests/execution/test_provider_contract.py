import pytest
from app.execution.simulated_provider import SimulatedExecutionProvider
from app.execution.razorpay import RazorpayExecutionProvider
from app.execution.provider_config import ProviderConfig
from app.domain.actions import ActionType


def test_provider_contract_names_and_supports() -> None:
    sim = SimulatedExecutionProvider()
    assert sim.provider_name() == "SIMULATED_PROVIDER"
    assert sim.supports(ActionType.SEND_PAYMENT_LINK) is True

    cfg = ProviderConfig(provider_type="razorpay", environment="test")
    rzp = RazorpayExecutionProvider(config=cfg)
    assert rzp.provider_name() == "razorpay"
    assert rzp.supports(ActionType.SEND_PAYMENT_LINK) is True
    assert rzp.supports(ActionType.SEND_PAYMENT_REMINDER) is False
