import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.connection import Base
from app.database.session import get_db
from app.jobs.dispatcher import RecoveryJobDispatcher
from app.repository.models import CustomerModel, PaymentModel, RecoveryCaseModel

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

HEADER_VIEWER = {"X-Operations-Key": "dev_ops_secret_key", "X-Operations-Role": "VIEWER"}
HEADER_OPERATOR = {"X-Operations-Key": "dev_ops_secret_key", "X-Operations-Role": "OPERATOR"}


def test_job_operations_api_rbac_and_endpoints() -> None:
    # Seed data
    db = TestingSessionLocal()
    cust = CustomerModel(id="cust_api_j001")
    pay = PaymentModel(id="pay_api_j001", customer_id="cust_api_j001", amount=1800.0, status="FAILED")
    case = RecoveryCaseModel(id="case_api_j001", payment_id="pay_api_j001", customer_id="cust_api_j001", state="DETECTED")
    db.add_all([cust, pay, case])
    db.commit()

    dispatcher = RecoveryJobDispatcher()
    job = dispatcher.enqueue_job(db, case_id="case_api_j001", payment_id="pay_api_j001", customer_id="cust_api_j001")
    db.close()

    # GET /operations/jobs - VIEWER allowed
    res_list = client.get("/api/v1/operations/jobs", headers=HEADER_VIEWER)
    assert res_list.status_code == 200
    assert res_list.json()["count"] >= 1

    # POST /operations/jobs/recover-expired - VIEWER blocked (403)
    res_rec_v = client.post("/api/v1/operations/jobs/recover-expired", headers=HEADER_VIEWER)
    assert res_rec_v.status_code == 403

    # POST /operations/jobs/recover-expired - OPERATOR allowed (200)
    res_rec_op = client.post("/api/v1/operations/jobs/recover-expired", headers=HEADER_OPERATOR)
    assert res_rec_op.status_code == 200
    assert res_rec_op.json()["status"] == "success"
