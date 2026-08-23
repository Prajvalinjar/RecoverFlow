import pytest
from app.security.rate_limit import InMemoryRateLimiter, RateLimitCategory


def test_rate_limiter_allows_requests_within_limit() -> None:
    limiter = InMemoryRateLimiter()
    limiter.reset()

    r1 = limiter.check_rate_limit("client_1", category=RateLimitCategory.WEBHOOK, max_requests=2, window_seconds=60)
    assert r1.allowed is True

    r2 = limiter.check_rate_limit("client_1", category=RateLimitCategory.WEBHOOK, max_requests=2, window_seconds=60)
    assert r2.allowed is True


def test_rate_limiter_blocks_requests_exceeding_limit() -> None:
    limiter = InMemoryRateLimiter()
    limiter.reset()

    limiter.check_rate_limit("client_2", category=RateLimitCategory.WEBHOOK, max_requests=2, window_seconds=60)
    limiter.check_rate_limit("client_2", category=RateLimitCategory.WEBHOOK, max_requests=2, window_seconds=60)

    # 3rd request exceeds limit
    r3 = limiter.check_rate_limit("client_2", category=RateLimitCategory.WEBHOOK, max_requests=2, window_seconds=60)
    assert r3.allowed is False
    assert r3.remaining == 0


def test_rate_limiter_independent_client_keys() -> None:
    limiter = InMemoryRateLimiter()
    limiter.reset()

    limiter.check_rate_limit("client_A", category=RateLimitCategory.OPERATIONS, max_requests=1, window_seconds=60)
    blocked_A = limiter.check_rate_limit("client_A", category=RateLimitCategory.OPERATIONS, max_requests=1, window_seconds=60)
    assert blocked_A.allowed is False

    allowed_B = limiter.check_rate_limit("client_B", category=RateLimitCategory.OPERATIONS, max_requests=1, window_seconds=60)
    assert allowed_B.allowed is True
