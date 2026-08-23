import pytest
from app.execution.provider_config import ProviderConfig, ProviderConfigurationError


def test_provider_config_defaults() -> None:
    cfg = ProviderConfig()
    cfg.validate()
    assert cfg.provider_type in ("simulated", "razorpay")
    assert cfg.environment in ("test", "production")
    assert "razorpay_key_secret" not in repr(cfg)


def test_provider_config_production_fail_closed() -> None:
    cfg = ProviderConfig(provider_type="razorpay", environment="production", razorpay_key_id=None)
    with pytest.raises(ProviderConfigurationError, match="Production mode requires mandatory RAZORPAY_KEY_ID"):
        cfg.validate()


def test_provider_config_sanitization() -> None:
    cfg = ProviderConfig(provider_type="razorpay", environment="test", razorpay_key_id="secret_id_123", razorpay_key_secret="secret_val_456")
    san = cfg.sanitized_dict()
    assert san["has_key_id"] is True
    assert san["has_key_secret"] is True
    assert "secret_id_123" not in str(san)
    assert "secret_val_456" not in str(san)
