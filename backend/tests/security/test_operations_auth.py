import pytest
from fastapi import HTTPException
from app.security.operations_auth import (
    ApiKeyOperationsAuthenticator,
    DevelopmentOperationsAuthenticator,
    OperationalRole,
)
from app.security.config import reset_security_config


def test_operations_auth_valid_key_and_role() -> None:
    authenticator = ApiKeyOperationsAuthenticator(valid_key="test_ops_key")
    role = authenticator.authenticate(key="test_ops_key", role="OPERATOR")
    assert role == OperationalRole.OPERATOR


def test_operations_auth_invalid_key_raises_401() -> None:
    authenticator = ApiKeyOperationsAuthenticator(valid_key="test_ops_key")
    with pytest.raises(HTTPException) as exc:
        authenticator.authenticate(key="wrong_key", role="OPERATOR")
    assert exc.value.status_code == 401


def test_operations_auth_missing_key_raises_401() -> None:
    authenticator = ApiKeyOperationsAuthenticator(valid_key="test_ops_key")
    with pytest.raises(HTTPException) as exc:
        authenticator.authenticate(key=None, role="OPERATOR")
    assert exc.value.status_code == 401


def test_development_authenticator_blocked_in_production(monkeypatch) -> None:
    monkeypatch.setenv("RECOVERFLOW_ENVIRONMENT", "production")
    monkeypatch.setenv("RECOVERFLOW_WEBHOOK_SECRET", "test_webhook_sec")
    monkeypatch.setenv("RECOVERFLOW_OPERATIONS_KEY", "test_ops_key")
    reset_security_config()

    authenticator = DevelopmentOperationsAuthenticator(valid_key="test_ops_key")
    with pytest.raises(Exception):
        authenticator.authenticate(key="test_ops_key", role="OPERATOR")
    reset_security_config()
