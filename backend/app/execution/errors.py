from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any


class ProviderErrorCategory(str, Enum):
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    RATE_LIMITED = "RATE_LIMITED"
    NETWORK_ERROR = "NETWORK_ERROR"
    TIMEOUT = "TIMEOUT"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"
    DUPLICATE_REQUEST = "DUPLICATE_REQUEST"
    UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION"
    PAYMENT_STATE_INVALID = "PAYMENT_STATE_INVALID"
    UNKNOWN_PROVIDER_ERROR = "UNKNOWN_PROVIDER_ERROR"


# Strict, deterministic retryability classification matrix
RETRYABLE_ERROR_CATEGORIES = {
    ProviderErrorCategory.NETWORK_ERROR,
    ProviderErrorCategory.TIMEOUT,
    ProviderErrorCategory.PROVIDER_UNAVAILABLE,
    ProviderErrorCategory.RATE_LIMITED,
}

NON_RETRYABLE_ERROR_CATEGORIES = {
    ProviderErrorCategory.AUTHENTICATION_ERROR,
    ProviderErrorCategory.AUTHORIZATION_ERROR,
    ProviderErrorCategory.VALIDATION_ERROR,
    ProviderErrorCategory.UNSUPPORTED_OPERATION,
    ProviderErrorCategory.PAYMENT_STATE_INVALID,
    ProviderErrorCategory.DUPLICATE_REQUEST,
    ProviderErrorCategory.UNKNOWN_PROVIDER_ERROR,
}


@dataclass(frozen=True)
class NormalizedProviderError:
    """Provider-neutral normalized error model."""
    category: ProviderErrorCategory
    code: str
    message: str
    retryable: bool
    provider: str
    http_code: Optional[int] = None
    raw_error: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "category": self.category.value,
            "code": self.code,
            "message": self.message,
            "retryable": self.retryable,
            "http_code": self.http_code,
            "correlation_id": self.correlation_id,
        }


class NormalizedProviderException(Exception):
    """Exception wrapper carrying a NormalizedProviderError."""
    def __init__(self, error: NormalizedProviderError):
        super().__init__(f"[{error.provider}] {error.category.value}: {error.message}")
        self.error = error


def classify_provider_error(
    provider: str,
    code: Optional[str] = None,
    message: Optional[str] = None,
    http_code: Optional[int] = None,
    correlation_id: Optional[str] = None,
) -> NormalizedProviderError:
    """Converts provider raw status/HTTP codes/errors into a NormalizedProviderError."""
    err_code = (code or "UNKNOWN_ERROR").upper()
    err_msg = message or "An error occurred during provider execution."
    cat = ProviderErrorCategory.UNKNOWN_PROVIDER_ERROR

    # HTTP Status Code Rules
    if http_code == 401:
        cat = ProviderErrorCategory.AUTHENTICATION_ERROR
    elif http_code == 403:
        cat = ProviderErrorCategory.AUTHORIZATION_ERROR
    elif http_code in (400, 422):
        cat = ProviderErrorCategory.VALIDATION_ERROR
    elif http_code == 429:
        cat = ProviderErrorCategory.RATE_LIMITED
    elif http_code == 504 or "TIMEOUT" in err_code:
        cat = ProviderErrorCategory.TIMEOUT
    elif http_code in (502, 503) or "UNAVAILABLE" in err_code:
        cat = ProviderErrorCategory.PROVIDER_UNAVAILABLE
    elif http_code == 500 or "CONNECTION" in err_code or "NETWORK" in err_code:
        cat = ProviderErrorCategory.NETWORK_ERROR
    elif "DUPLICATE" in err_code or "IDEMPOTENCY" in err_code:
        cat = ProviderErrorCategory.DUPLICATE_REQUEST
    elif "UNSUPPORTED" in err_code:
        cat = ProviderErrorCategory.UNSUPPORTED_OPERATION
    elif "INVALID_STATE" in err_code or "PAYMENT_STATE" in err_code:
        cat = ProviderErrorCategory.PAYMENT_STATE_INVALID

    retryable = cat in RETRYABLE_ERROR_CATEGORIES

    return NormalizedProviderError(
        category=cat,
        code=err_code,
        message=err_msg,
        retryable=retryable,
        provider=provider,
        http_code=http_code,
        correlation_id=correlation_id,
    )
