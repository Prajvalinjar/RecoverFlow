import time
import pytest
from app.security.replay import (
    ReplayProtectionService,
    InMemoryReplayProtectionStore,
    ReplayStatus,
)


def test_replay_protection_first_request_accepted() -> None:
    store = InMemoryReplayProtectionStore()
    service = ReplayProtectionService(store=store, tolerance_seconds=300)

    result = service.check_and_record("sig_unique_001", timestamp=time.time())
    assert result.status == ReplayStatus.ACCEPTED


def test_replay_protection_duplicate_rejected() -> None:
    store = InMemoryReplayProtectionStore()
    service = ReplayProtectionService(store=store, tolerance_seconds=300)
    now = time.time()

    r1 = service.check_and_record("sig_unique_002", timestamp=now)
    assert r1.status == ReplayStatus.ACCEPTED

    r2 = service.check_and_record("sig_unique_002", timestamp=now)
    assert r2.status == ReplayStatus.REPLAY_REJECTED


def test_replay_protection_expired_timestamp_rejected() -> None:
    store = InMemoryReplayProtectionStore()
    service = ReplayProtectionService(store=store, tolerance_seconds=10)
    expired_ts = time.time() - 100

    result = service.check_and_record("sig_expired_003", timestamp=expired_ts)
    assert result.status == ReplayStatus.TIMESTAMP_EXPIRED


def test_replay_protection_store_reset() -> None:
    store = InMemoryReplayProtectionStore()
    store.record("sig_reset_004")
    assert store.is_replay("sig_reset_004") is True

    store.reset()
    assert store.is_replay("sig_reset_004") is False
