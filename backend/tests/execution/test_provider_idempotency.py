from app.execution.provider_config import ProviderConfig
from app.execution.razorpay import RazorpayExecutionProvider, RazorpayClient
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus


class MockIdempotentClient(RazorpayClient):
    def __init__(self, config):
        super().__init__(config)
        self.received_keys = []

    def create_payment_link(self, amount_paisa, currency="INR", description="", idempotency_key=None):
        self.received_keys.append(idempotency_key)
        return {"id": "plink_idemp_01", "status": "created"}


def test_provider_idempotency_key_propagation() -> None:
    cfg = ProviderConfig(provider_type="razorpay", environment="test")
    client = MockIdempotentClient(cfg)
    provider = RazorpayExecutionProvider(config=cfg, client=client)

    action = CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK, parameters={"amount": 199.0})
    ex = RecoveryExecution(
        execution_id="ex_idemp_01",
        case_id="case_idemp_01",
        policy_decision_id="pd_idemp_01",
        action=action,
        status=ExecutionStatus.PENDING,
        idempotency_key="ik_test_propagated_key",
    )

    provider.execute_action(ex)
    assert len(client.received_keys) == 1
    assert client.received_keys[0] == "ik_test_propagated_key"
