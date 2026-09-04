import time
import threading
from abc import ABC, abstractmethod
from enum import Enum
from dataclasses import dataclass
from typing import Dict, Optional

from app.security.config import get_security_config


class ReplayStatus(str, Enum):
    ACCEPTED = "ACCEPTED"
    REPLAY_REJECTED = "REPLAY_REJECTED"
    TIMESTAMP_EXPIRED = "TIMESTAMP_EXPIRED"
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED"


@dataclass(frozen=True)
class ReplayProtectionResult:
    status: ReplayStatus
    message: str
    signature_or_id: Optional[str] = None


class ReplayProtectionStore(ABC):
    @abstractmethod
    def is_replay(self, signature_or_id: str) -> bool:
        pass

    @abstractmethod
    def record(self, signature_or_id: str, timestamp: Optional[float] = None) -> None:
        pass

    @abstractmethod
    def reset(self) -> None:
        pass


class InMemoryReplayProtectionStore(ReplayProtectionStore):
    """Thread-safe bounded in-memory replay protection store."""

    def __init__(self, max_entries: int = 10000, default_ttl_seconds: int = 3600) -> None:
        self.max_entries = max_entries
        self.default_ttl_seconds = default_ttl_seconds
        self._consumed: Dict[str, float] = {}
        self._lock = threading.Lock()

    def is_replay(self, signature_or_id: str) -> bool:
        with self._lock:
            self._cleanup_expired()
            return signature_or_id in self._consumed

    def record(self, signature_or_id: str, timestamp: Optional[float] = None) -> None:
        with self._lock:
            self._cleanup_expired()
            # Bounded capacity check
            if len(self._consumed) >= self.max_entries:
                # Evict oldest entry
                oldest_key = min(self._consumed, key=self._consumed.get)  # type: ignore
                del self._consumed[oldest_key]

            ts = timestamp if timestamp is not None else time.time()
            self._consumed[signature_or_id] = ts

    def _cleanup_expired(self) -> None:
        now = time.time()
        expired_keys = [
            k for k, ts in self._consumed.items() if now - ts > self.default_ttl_seconds
        ]
        for k in expired_keys:
            del self._consumed[k]

    def reset(self) -> None:
        with self._lock:
            self._consumed.clear()


class ReplayProtectionService:
    """Service evaluating request timestamp freshness and signature replay prevention."""

    def __init__(
        self,
        store: Optional[ReplayProtectionStore] = None,
        tolerance_seconds: Optional[int] = None,
    ) -> None:
        self.store = store or InMemoryReplayProtectionStore()
        self._explicit_tolerance = tolerance_seconds

    @property
    def config(self):
        return get_security_config()

    @property
    def tolerance_seconds(self) -> int:
        if self._explicit_tolerance is not None:
            return self._explicit_tolerance
        try:
            return self.config.webhook_timestamp_tolerance_seconds
        except Exception:
            return 300

    def check_and_record(
        self, signature_or_id: str, timestamp: Optional[float] = None
    ) -> ReplayProtectionResult:
        if not signature_or_id:
            return ReplayProtectionResult(
                status=ReplayStatus.AUTHENTICATION_FAILED,
                message="Missing signature or request identifier for replay check.",
            )

        now = time.time()
        if timestamp is not None:
            if abs(now - timestamp) > self.tolerance_seconds:
                return ReplayProtectionResult(
                    status=ReplayStatus.TIMESTAMP_EXPIRED,
                    message=f"Request timestamp is outside tolerance window ({self.tolerance_seconds}s).",
                    signature_or_id=signature_or_id,
                )

        if self.store.is_replay(signature_or_id):
            return ReplayProtectionResult(
                status=ReplayStatus.REPLAY_REJECTED,
                message=f"Replay attack detected. Signature/Event ID '{signature_or_id[:16]}...' was already processed.",
                signature_or_id=signature_or_id,
            )

        self.store.record(signature_or_id, timestamp=timestamp or now)
        return ReplayProtectionResult(
            status=ReplayStatus.ACCEPTED,
            message="Request accepted by replay protection.",
            signature_or_id=signature_or_id,
        )


replay_protection_service = ReplayProtectionService()
