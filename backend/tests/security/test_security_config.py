import os
import pytest
from app.security.config import (
    SecurityConfig,
    SecurityConfigurationError,
    get_security_config,
    reset_security_config,
    DEV_WEBHOOK_SECRET_DEFAULT,
    DEV_OPERATIONS_KEY_DEFAULT,
)


def test_development_config_defaults(monkeypatch) -> None:
    monkeypatch.setenv("RECOVERFLOW_ENVIRONMENT", "development")
    monkeypatch.delenv("RECOVERFLOW_WEBHOOK_SECRET", raising=False)
    monkeypatch.delenv("RECOVERFLOW_OPERATIONS_KEY", raising=False)
    reset_security_config()

    config = get_security_config()
    assert config.environment == "development"
    assert config.webhook_secret == DEV_WEBHOOK_SECRET_DEFAULT
    assert config.operations_api_key == DEV_OPERATIONS_KEY_DEFAULT
    assert config.require_https is False


def test_production_mode_requires_secrets(monkeypatch) -> None:
    monkeypatch.setenv("RECOVERFLOW_ENVIRONMENT", "production")
    monkeypatch.delenv("RECOVERFLOW_WEBHOOK_SECRET", raising=False)
    monkeypatch.delenv("RECOVERFLOW_OPERATIONS_KEY", raising=False)
    reset_security_config()

    with pytest.raises(SecurityConfigurationError):
        SecurityConfig.load_from_env()


def test_production_mode_accepts_valid_secrets(monkeypatch) -> None:
    monkeypatch.setenv("RECOVERFLOW_ENVIRONMENT", "production")
    monkeypatch.setenv("RECOVERFLOW_WEBHOOK_SECRET", "prod_super_secret_webhook_key_99")
    monkeypatch.setenv("RECOVERFLOW_OPERATIONS_KEY", "prod_super_secret_ops_key_88")
    reset_security_config()

    config = SecurityConfig.load_from_env()
    assert config.environment == "production"
    assert config.webhook_secret == "prod_super_secret_webhook_key_99"
    assert config.operations_api_key == "prod_super_secret_ops_key_88"
    assert config.require_https is True
    reset_security_config()
