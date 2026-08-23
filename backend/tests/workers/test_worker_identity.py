import pytest
from app.workers.worker_identity import WorkerIdentity, WorkerStatus


def test_worker_identity_creation_and_defaults() -> None:
    w = WorkerIdentity(worker_id="worker_test_1")
    assert w.worker_id == "worker_test_1"
    assert w.status == WorkerStatus.STARTING
    assert w.is_active is True
    assert "RECOVERY_CYCLE" in w.capabilities


def test_worker_identity_validation() -> None:
    with pytest.raises(ValueError, match="worker_id cannot be empty"):
        WorkerIdentity(worker_id="")
