import time
import hmac
import hashlib
import pytest
from starlette.requests import Request
from app.security.event_auth import (
    HMACWebhookAuthenticator,
    DevelopmentEventAuthenticator,
    verify_event_authentication,
)
from app.security.config import reset_security_config


def test_hmac_webhook_authenticator_valid_signature(monkeypatch) -> None:
    monkeypatch.setenv("RECOVERFLOW_ENVIRONMENT", "production")
    monkeypatch.setenv("RECOVERFLOW_WEBHOOK_SECRET", "test_secret_123")
    monkeypatch.setenv("RECOVERFLOW_OPERATIONS_KEY", "test_ops_key_123")
    reset_security_config()

    authenticator = HMACWebhookAuthenticator(secret="test_secret_123", tolerance_seconds=300)
    raw_body = b'{"event_id": "evt_test_hmac_1"}'

    # Compute expected signature
    signature = hmac.new(b"test_secret_123", raw_body, hashlib.sha256).hexdigest()

    req = Request(
        scope={
            "type": "http",
            "method": "POST",
            "path": "/api/v1/events/payment-failure",
            "headers": [(b"x-signature", signature.encode("utf-8"))],
        }
    )

    result = authenticator.authenticate_request(req, raw_body)
    assert result.authenticated is True
    assert result.signature_verified is True
    reset_security_config()


def test_hmac_webhook_authenticator_invalid_signature() -> None:
    authenticator = HMACWebhookAuthenticator(secret="test_secret_123")
    raw_body = b'{"event_id": "evt_test_hmac_2"}'
    invalid_signature = "bad_signature_hash_12345"

    req = Request(
        scope={
            "type": "http",
            "method": "POST",
            "path": "/api/v1/events/payment-failure",
            "headers": [(b"x-signature", invalid_signature.encode("utf-8"))],
        }
    )

    result = authenticator.authenticate_request(req, raw_body)
    assert result.authenticated is False
    assert result.error_code == "INVALID_SIGNATURE"


def test_hmac_webhook_authenticator_expired_timestamp() -> None:
    authenticator = HMACWebhookAuthenticator(secret="test_secret_123", tolerance_seconds=10)
    raw_body = b'{"event_id": "evt_test_hmac_3"}'
    expired_ts = time.time() - 500  # 500 seconds ago > 10s tolerance

    req = Request(
        scope={
            "type": "http",
            "method": "POST",
            "path": "/api/v1/events/payment-failure",
            "headers": [
                (b"x-signature", b"dummy_sig"),
                (b"x-signature-timestamp", str(expired_ts).encode("utf-8")),
            ],
        }
    )

    result = authenticator.authenticate_request(req, raw_body)
    assert result.authenticated is False
    assert result.error_code == "EXPIRED_WEBHOOK"
