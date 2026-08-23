import time
import threading
from abc import ABC, abstractmethod
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional, Callable
from fastapi import Request, HTTPException, status

from app.security.config import get_security_config


class RateLimitCategory(str, Enum):
    WEBHOOK = "WEBHOOK"
    OPERATIONS = "OPERATIONS"
    GENERAL_API = "GENERAL_API"


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    remaining: int
    reset_seconds: int
    category: RateLimitCategory
    client_key: str


class RateLimiter(ABC):
    @abstractmethod
    def check_rate_limit(
        self,
        client_key: str,
        category: RateLimitCategory = RateLimitCategory.GENERAL_API,
        max_requests: Optional[int] = None,
        window_seconds: Optional[int] = None,
    ) -> RateLimitResult:
        pass

    @abstractmethod
    def reset(self) -> None:
        pass


class InMemoryRateLimiter(RateLimiter):
    """Thread-safe sliding-window in-memory rate limiter."""

    def __init__(self) -> None:
        self.config = get_security_config()
        self._history: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

        # Category default configurations
        self._defaults = {
            RateLimitCategory.WEBHOOK: (100, 60),
            RateLimitCategory.OPERATIONS: (60, 60),
            RateLimitCategory.GENERAL_API: (120, 60),
        }

    def check_rate_limit(
        self,
        client_key: str,
        category: RateLimitCategory = RateLimitCategory.GENERAL_API,
        max_requests: Optional[int] = None,
        window_seconds: Optional[int] = None,
    ) -> RateLimitResult:
        default_max, default_win = self._defaults.get(category, (120, 60))
        limit = max_requests if max_requests is not None else default_max
        window = window_seconds if window_seconds is not None else default_win

        storage_key = f"{category.value}:{client_key}"
        now = time.time()
        cutoff = now - window

        with self._lock:
            timestamps = self._history.get(storage_key, [])
            # Evict timestamps older than sliding window
            timestamps = [ts for ts in timestamps if ts > cutoff]

            if len(timestamps) >= limit:
                oldest = timestamps[0] if timestamps else now
                reset_in = max(1, int(oldest + window - now))
                self._history[storage_key] = timestamps
                return RateLimitResult(
                    allowed=False,
                    remaining=0,
                    reset_seconds=reset_in,
                    category=category,
                    client_key=client_key,
                )

            timestamps.append(now)
            self._history[storage_key] = timestamps
            remaining = max(0, limit - len(timestamps))

            return RateLimitResult(
                allowed=True,
                remaining=remaining,
                reset_seconds=window,
                category=category,
                client_key=client_key,
            )

    def reset(self) -> None:
        with self._lock:
            self._history.clear()


rate_limiter = InMemoryRateLimiter()


def enforce_rate_limit(
    category: RateLimitCategory = RateLimitCategory.GENERAL_API,
) -> Callable:
    """FastAPI dependency factory enforcing rate limits."""
    async def dependency(request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown_client"
        client_key = request.headers.get("X-Forwarded-For", client_ip).split(",")[0].strip()

        result = rate_limiter.check_rate_limit(client_key=client_key, category=category)
        if not result.allowed:
            correlation_id = getattr(request.state, "correlation_id", "unknown")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit exceeded for category '{category.value}'. Retry in {result.reset_seconds}s.",
                    "correlation_id": correlation_id,
                    "retry_after_seconds": result.reset_seconds,
                },
                headers={"Retry-After": str(result.reset_seconds)},
            )
    return dependency
