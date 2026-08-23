import pytest
from app.execution.provider_config import ProviderConfig
from app.execution.razorpay import RazorpayExecutionProvider, RazorpayClient
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.execution_result import ProviderExecutionStatus
from app.domain.orchestrator import PolicyApprovalRequiredError


class MockRazorpayClient(RazorpayClient):
    def create_payment_link(self, amount_paisa, currency="INR", description="", idempotency_key=None):
        return {"id": "plink_test_99", "status": "created"}

    def capture_payment(self, payment_id, amount_paisa, currency="INR"):
        return {"id": "cap_test_99", "status": "captured"}


def test_razorpay_provider_unauthorized_input_rejected() -> None:
    cfg = ProviderConfig(provider_type="razorpay", environment="test")
    provider = RazorpayExecutionProvider(config=cfg)
    with pytest.raises(PolicyApprovalRequiredError):
        provider.execute_action("unauthorized_string_input")


def test_razorpay_provider_payment_link_execution() -> None:
    cfg = ProviderConfig(provider_type="razorpay", environment="test")
    client = MockRazorpayClient(cfg)
    provider = RazorpayExecutionProvider(config=cfg, client=client)

    action = CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK, parameters={"amount": 999.0})
    ex = RecoveryExecution(
        execution_id="ex_rzp_t1",
        case_id="case_t1",
        policy_decision_id="pd_t1",
        action=action,
        status=ExecutionStatus.PENDING,
        idempotency_key="ik_rzp_t1",
    )

    res = provider.execute_action(ex)
    assert res.status in (ProviderExecutionStatus.ACCEPTED, ProviderExecutionStatus.COMPLETED)
    assert res.provider_reference == "plink_test_99"


def test_razorpay_provider_unsupported_action() -> None:
    cfg = ProviderConfig(provider_type="razorpay", environment="test")
    provider = RazorpayExecutionProvider(config=cfg)
    action = CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_REMINDER, parameters={})
    ex = RecoveryExecution(
        execution_id="ex_rzp_t2",
        case_id="case_t2",
        policy_decision_id="pd_t2",
        action=action,
        status=ExecutionStatus.PENDING,
        idempotency_key="ik_rzp_t2",
    )

    res = provider.execute_action(ex)
    assert res.status == ProviderExecutionStatus.REJECTED
    assert res.metadata.get("error_code") == "UNSUPPORTED_OPERATION"
