import hmac
import hashlib
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
from fastapi import Request, HTTPException, status, Header

from app.security.config import get_security_config, SecurityConfigurationError


@dataclass(frozen=True)
class WebhookAuthenticationResult:
    authenticated: bool
    signature_verified: bool
    reason: str = "SUCCESS"
    error_code: Optional[str] = None
    timestamp: Optional[float] = None


class EventAuthenticator(ABC):
    """Abstract interface for event webhook authentication."""

    @abstractmethod
    def authenticate_request(
        self, request: Request, raw_body: bytes, secret_header: Optional[str] = None
    ) -> WebhookAuthenticationResult:
        pass


class DevelopmentEventAuthenticator(EventAuthenticator):
    """Development mode event authenticator.
    
    Validates development secret headers or allows local dev execution.
    Fails closed if running in production mode.
    """

    def __init__(self, required_secret: Optional[str] = None) -> None:
        self.config = get_security_config()
        self.required_secret = required_secret or self.config.webhook_secret

    def authenticate_request(
        self, request: Request, raw_body: bytes, secret_header: Optional[str] = None
    ) -> WebhookAuthenticationResult:
        if self.config.environment == "production":
            raise SecurityConfigurationError(
                "DevelopmentEventAuthenticator cannot be used in production mode."
            )

        # Check explicit secret header if passed
        provided_secret = secret_header or request.headers.get("X-Event-Secret")
        if provided_secret:
            if hmac.compare_digest(provided_secret, self.required_secret):
                return WebhookAuthenticationResult(
                    authenticated=True, signature_verified=True, reason="Valid dev secret header"
                )
            return WebhookAuthenticationResult(
                authenticated=False,
                signature_verified=False,
                reason="Invalid secret header",
                error_code="INVALID_SECRET_HEADER",
            )

        # Allow fallback in dev/testing mode only
        return WebhookAuthenticationResult(
            authenticated=True, signature_verified=True, reason="Development fallback"
        )


class HMACWebhookAuthenticator(EventAuthenticator):
    """HMAC-SHA256 signature verification authenticator."""

    def __init__(self, secret: Optional[str] = None, tolerance_seconds: Optional[int] = None) -> None:
        self.config = get_security_config()
        self.secret = (secret or self.config.webhook_secret).encode("utf-8")
        self.tolerance_seconds = tolerance_seconds or self.config.webhook_timestamp_tolerance_seconds

    def compute_signature(self, payload: bytes) -> str:
        return hmac.new(self.secret, payload, hashlib.sha256).hexdigest()

    def authenticate_request(
        self, request: Request, raw_body: bytes, secret_header: Optional[str] = None
    ) -> WebhookAuthenticationResult:
        signature = secret_header or request.headers.get("X-Signature") or request.headers.get("X-Razorpay-Signature")
        timestamp_header = request.headers.get("X-Signature-Timestamp") or request.headers.get("X-Webhook-Timestamp")

        if not signature:
            return WebhookAuthenticationResult(
                authenticated=False,
                signature_verified=False,
                reason="Missing signature header",
                error_code="MISSING_SIGNATURE",
            )

        now = time.time()
        parsed_timestamp: Optional[float] = None
        if timestamp_header:
            try:
                parsed_timestamp = float(timestamp_header)
                if abs(now - parsed_timestamp) > self.tolerance_seconds:
                    return WebhookAuthenticationResult(
                        authenticated=False,
                        signature_verified=False,
                        reason=f"Timestamp expired. Delta > {self.tolerance_seconds}s.",
                        error_code="EXPIRED_WEBHOOK",
                        timestamp=parsed_timestamp,
                    )
            except ValueError:
                return WebhookAuthenticationResult(
                    authenticated=False,
                    signature_verified=False,
                    reason="Malformed timestamp header",
                    error_code="MALFORMED_TIMESTAMP",
                )

        # Build payload for signature verification (timestamp.body or raw_body)
        if timestamp_header:
            payload_to_sign = f"{timestamp_header}.".encode("utf-8") + raw_body
        else:
            payload_to_sign = raw_body

        expected_signature = self.compute_signature(payload_to_sign)
        # Also check raw body fallback signature if header was raw body signature
        raw_expected_signature = self.compute_signature(raw_body)

        is_valid = hmac.compare_digest(signature.lower(), expected_signature.lower()) or hmac.compare_digest(
            signature.lower(), raw_expected_signature.lower()
        )

        if not is_valid:
            return WebhookAuthenticationResult(
                authenticated=False,
                signature_verified=False,
                reason="Invalid HMAC signature",
                error_code="INVALID_SIGNATURE",
                timestamp=parsed_timestamp,
            )

        return WebhookAuthenticationResult(
            authenticated=True,
            signature_verified=True,
            reason="HMAC signature verified",
            timestamp=parsed_timestamp,
        )


class RazorpayEventAuthenticator(HMACWebhookAuthenticator):
    """Production Razorpay webhook authenticator subclass."""
    pass


async def verify_event_authentication(
    request: Request,
    x_event_secret: Optional[str] = Header(None, alias="X-Event-Secret"),
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
) -> bool:
    """FastAPI dependency enforcing event request authentication and HMAC verification."""
    config = get_security_config()
    raw_body = await request.body()

    if config.environment == "production" or x_signature or request.headers.get("X-Razorpay-Signature"):
        authenticator = HMACWebhookAuthenticator()
        result = authenticator.authenticate_request(request, raw_body, secret_header=x_signature)
    else:
        authenticator = DevelopmentEventAuthenticator()
        result = authenticator.authenticate_request(request, raw_body, secret_header=x_event_secret)

    if not result.authenticated or not result.signature_verified:
        status_code = status.HTTP_401_UNAUTHORIZED
        raise HTTPException(
            status_code=status_code,
            detail={
                "error": result.error_code or "AUTHENTICATION_FAILED",
                "error_code": "EVENT_AUTHENTICATION_FAILED",
                "message": result.reason,
            },
        )
    return True
