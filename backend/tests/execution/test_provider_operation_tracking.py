import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.repository.models import ProviderOperationModel
from app.repository.postgres import PostgresProviderOperationRepository


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_provider_operation_persistence(db_session):
    repo = PostgresProviderOperationRepository(db_session)
    op = ProviderOperationModel(
        id="pop_1001",
        execution_id="exec_1001",
        provider_name="razorpay",
        provider_operation="create_payment_link",
        provider_reference_id="plink_1001",
        normalized_status="SUCCESS",
        idempotency_key="ik_test_1001",
        correlation_id="corr_test_1001",
    )
    saved = repo.save(op)
    db_session.commit()

    fetched = repo.get_by_id("pop_1001")
    assert fetched is not None
    assert fetched.execution_id == "exec_1001"
    assert fetched.provider_name == "razorpay"
    assert fetched.normalized_status == "SUCCESS"
