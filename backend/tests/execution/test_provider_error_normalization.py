import pytest
from app.execution.errors import classify_provider_error, ProviderErrorCategory, RETRYABLE_ERROR_CATEGORIES


def test_provider_error_classification():
    err_429 = classify_provider_error("razorpay", code="TOO_MANY_REQUESTS", http_code=429)
    assert err_429.category == ProviderErrorCategory.RATE_LIMITED
    assert err_429.retryable is True

    err_401 = classify_provider_error("razorpay", code="BAD_REQUEST_HEADER", http_code=401)
    assert err_401.category == ProviderErrorCategory.AUTHENTICATION_ERROR
    assert err_401.retryable is False

    err_504 = classify_provider_error("razorpay", code="GATEWAY_TIMEOUT", http_code=504)
    assert err_504.category == ProviderErrorCategory.TIMEOUT
    assert err_504.retryable is True
