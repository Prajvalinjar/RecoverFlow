from app.execution.provider_config import ProviderConfig
from app.execution.razorpay import RazorpayExecutionProvider, RazorpayClient
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.execution_result import ProviderExecutionStatus


class ErrorClient(RazorpayClient):
    def create_payment_link(self, amount_paisa, currency="INR", description="", idempotency_key=None):
        return {"error": {"code": "BAD_REQUEST_ERROR", "description": "Amount invalid"}, "http_code": 400}


def test_provider_error_normalization() -> None:
    cfg = ProviderConfig(provider_type="razorpay", environment="test")
    client = ErrorClient(cfg)
    provider = RazorpayExecutionProvider(config=cfg, client=client)

    action = CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK, parameters={"amount": 0.0})
    ex = RecoveryExecution(
        execution_id="ex_err_01",
        case_id="case_err_01",
        policy_decision_id="pd_err_01",
        action=action,
        status=ExecutionStatus.PENDING,
        idempotency_key="ik_err_01",
    )

    res = provider.execute_action(ex)
    assert res.status == ProviderExecutionStatus.FAILED
    assert "Amount invalid" in res.error_message
