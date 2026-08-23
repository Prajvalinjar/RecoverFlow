import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.jobs.maintenance import MaintenanceService


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


def test_maintenance_service_run_once(db) -> None:
    svc = MaintenanceService(db)
    report = svc.run_once()
    assert report.executed_at is not None
    assert report.reconciliation_report is not None
