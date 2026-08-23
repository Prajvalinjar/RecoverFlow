import pytest
from app.execution.provider_config import ProviderConfig, ProviderConfigurationError


def test_provider_config_safe_status():
    cfg = ProviderConfig(provider_type="simulated", environment="test")
    status = cfg.safe_status()
    assert status["provider"] == "simulated"
    assert status["secrets_exposed"] is False
    assert "razorpay_key_secret" not in status


def test_production_mode_fails_closed(monkeypatch):
    monkeypatch.setenv("RECOVERFLOW_PAYMENT_PROVIDER", "razorpay")
    monkeypatch.setenv("RAZORPAY_ENVIRONMENT", "production")
    monkeypatch.delenv("RAZORPAY_KEY_ID", raising=False)
    monkeypatch.delenv("RAZORPAY_KEY_SECRET", raising=False)

    cfg = ProviderConfig()
    with pytest.raises(ProviderConfigurationError) as exc_info:
        cfg.validate()
    assert "Production mode requires mandatory" in str(exc_info.value)
