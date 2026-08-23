import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.connection import Base
from app.repository.postgres import PostgresRecoveryExecutionRepository
from app.repository.models import RecoveryExecutionModel, CustomerModel, PaymentModel, RecoveryCaseModel
from app.execution.simulated_provider import SimulatedExecutionProvider
from app.domain.execution import RecoveryExecution
from app.domain.actions import CandidateRecoveryAction, ActionType


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_unique_idempotency_key_constraint(db_session) -> None:
    db_session.add(CustomerModel(id="cust_ik_1"))
    db_session.add(PaymentModel(id="pay_ik_1", customer_id="cust_ik_1", amount=1000.0, status="FAILED"))
    db_session.add(RecoveryCaseModel(id="case_ik_1", payment_id="pay_ik_1", customer_id="cust_ik_1", state="DETECTED"))
    db_session.commit()

    repo = PostgresRecoveryExecutionRepository(db_session)

    exec1 = RecoveryExecutionModel(
        execution_id="exec_ik_001",
        case_id="case_ik_1",
        policy_decision_id="pol_ik_1",
        action_type="RETRY_IMMEDIATE",
        status="COMPLETED",
        idempotency_key="unique_key_12345",
    )
    repo.save(exec1)
    db_session.commit()

    fetched = repo.get_by_idempotency_key("unique_key_12345")
    assert fetched is not None
    assert fetched.execution_id == "exec_ik_001"


def test_execution_idempotency_caching():
    provider = SimulatedExecutionProvider()
    execution = RecoveryExecution(
        execution_id="exec_idem_400",
        case_id="case_idem_400",
        policy_decision_id="pol_idem_400",
        action=CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK),
        idempotency_key="ik_idem_400",
    )

    res1 = provider.execute_action(execution)
    res2 = provider.execute_action(execution)

    assert res1.execution_id == res2.execution_id
    assert res1.provider_reference == res2.provider_reference
    assert res1.status == res2.status
