import pytest
from app.execution.rate_limit import provider_rate_limit_handler
from app.execution.errors import ProviderErrorCategory


def test_handle_provider_rate_limit():
    err = provider_rate_limit_handler.handle_rate_limit(
        provider_name="razorpay",
        execution_id="exec_rate_01",
        correlation_id="corr_rate_01",
        retry_after_seconds=30.0,
    )
    assert err.category == ProviderErrorCategory.RATE_LIMITED
    assert err.retryable is True
    assert err.http_code == 429
