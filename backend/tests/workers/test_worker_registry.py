import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.workers.worker_identity import WorkerIdentity, WorkerStatus
from app.workers.worker_registry import WorkerRegistry


@pytest.fixture
def db():
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=eng)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_worker_registry_registration_and_heartbeat(db) -> None:
    registry = WorkerRegistry(db)
    w = WorkerIdentity(worker_id="w_reg_001")
    registered = registry.register_worker(w)
    assert registered.worker_id == "w_reg_001"

    # Heartbeat
    hb_res = registry.heartbeat_worker("w_reg_001")
    assert hb_res is True

    # Draining
    registry.mark_draining("w_reg_001")
    fetched = registry.get_worker("w_reg_001")
    assert fetched.status == WorkerStatus.DRAINING


def test_worker_registry_stale_worker_detection(db) -> None:
    registry = WorkerRegistry(db)
    w = WorkerIdentity(worker_id="w_stale_001")
    registry.register_worker(w)

    # Force heartbeat into past
    from app.repository.models import WorkerModel
    model = db.query(WorkerModel).filter(WorkerModel.worker_id == "w_stale_001").first()
    model.last_heartbeat_at = datetime.now(timezone.utc) - timedelta(seconds=60)
    db.merge(model)
    db.commit()

    stale = registry.detect_stale_workers(timeout_seconds=30.0)
    assert len(stale) == 1
    assert stale[0].worker_id == "w_stale_001"
    assert stale[0].status == WorkerStatus.LOST
