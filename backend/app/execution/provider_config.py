import os
import logging
from dataclasses import dataclass, field
from typing import Optional, Dict, Any

logger = logging.getLogger("recoverflow.execution.provider_config")


class ProviderConfigurationError(Exception):
    """Raised when payment provider configuration is invalid or missing required credentials."""
    pass


@dataclass
class ProviderConfig:
    """Production-grade payment provider configuration dataclass."""

    provider_type: str = field(
        default_factory=lambda: os.getenv("RECOVERFLOW_PAYMENT_PROVIDER", "simulated").lower()
    )
    environment: str = field(
        default_factory=lambda: os.getenv("RAZORPAY_ENVIRONMENT", "test").lower()
    )
    razorpay_key_id: Optional[str] = field(
        default_factory=lambda: os.getenv("RAZORPAY_KEY_ID")
    )
    razorpay_key_secret: Optional[str] = field(
        default_factory=lambda: os.getenv("RAZORPAY_KEY_SECRET")
    )
    razorpay_webhook_secret: Optional[str] = field(
        default_factory=lambda: os.getenv("RAZORPAY_WEBHOOK_SECRET")
    )
    timeout_seconds: float = 10.0

    def validate(self) -> None:
        """Validates configuration settings and fails closed in production."""
        valid_providers = {"simulated", "razorpay"}
        if self.provider_type not in valid_providers:
            raise ProviderConfigurationError(
                f"Invalid provider_type '{self.provider_type}'. Must be one of {valid_providers}"
            )

        if self.provider_type == "razorpay":
            if self.environment == "production":
                if not self.razorpay_key_id or not self.razorpay_key_secret:
                    raise ProviderConfigurationError(
                        "Production mode requires mandatory RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
                    )
                if not self.razorpay_webhook_secret:
                    raise ProviderConfigurationError(
                        "Production mode requires mandatory RAZORPAY_WEBHOOK_SECRET."
                    )
            elif self.environment == "test":
                # Test mode requires credentials only if actively invoking external test API
                pass
            else:
                raise ProviderConfigurationError(
                    f"Invalid environment '{self.environment}'. Must be 'test' or 'production'."
                )

    def sanitized_dict(self) -> Dict[str, Any]:
        """Returns sanitized metadata for logging/telemetry without exposing secrets."""
        return {
            "provider_type": self.provider_type,
            "environment": self.environment,
            "has_key_id": bool(self.razorpay_key_id),
            "has_key_secret": bool(self.razorpay_key_secret),
            "has_webhook_secret": bool(self.razorpay_webhook_secret),
            "timeout_seconds": self.timeout_seconds,
        }

    def safe_status(self) -> Dict[str, Any]:
        """Returns safe configuration status object required for operational APIs without exposing secrets."""
        has_creds = (
            bool(self.razorpay_key_id and self.razorpay_key_secret)
            if self.provider_type == "razorpay"
            else True
        )
        return {
            "provider": self.provider_type,
            "environment": self.environment,
            "configured": True,
            "credentials_present": has_creds,
            "production_enabled": self.environment == "production",
            "secrets_exposed": False,
        }

    def __repr__(self) -> str:
        return (
            f"ProviderConfig(provider_type='{self.provider_type}', "
            f"environment='{self.environment}', "
            f"has_key_id={bool(self.razorpay_key_id)})"
        )

