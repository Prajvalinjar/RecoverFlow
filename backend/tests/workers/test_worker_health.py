import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.workers.worker_identity import WorkerIdentity
from app.workers.worker_registry import WorkerRegistry
from app.workers.worker_health import check_worker_fleet_health, WorkerFleetHealth


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


def test_worker_fleet_health_evaluation(db) -> None:
    registry = WorkerRegistry(db)
    registry.register_worker(WorkerIdentity(worker_id="w_h1"))
    registry.register_worker(WorkerIdentity(worker_id="w_h2"))

    fleet = check_worker_fleet_health(db)
    assert fleet.total_registered == 2
    assert fleet.active_count == 2
    assert fleet.is_fleet_degraded is False
