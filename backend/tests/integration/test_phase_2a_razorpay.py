import pytest
from app.execution.provider_config import ProviderConfig
from app.execution.razorpay import RazorpayExecutionProvider, RazorpayClient
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.execution_result import ProviderExecutionStatus
from app.events.razorpay_webhooks import RazorpayWebhookNormalizer
from app.events.event import EventType


class MockIntegrationClient(RazorpayClient):
    def create_payment_link(self, amount_paisa, currency="INR", description="", idempotency_key=None):
        return {"id": "plink_int_2a", "status": "created"}


def test_phase_2a_end_to_end_razorpay_flow() -> None:
    # 1. Config & Provider Setup
    cfg = ProviderConfig(provider_type="razorpay", environment="test")
    client = MockIntegrationClient(cfg)
    provider = RazorpayExecutionProvider(config=cfg, client=client)

    # 2. Execution
    action = CandidateRecoveryAction(action_type=ActionType.SEND_PAYMENT_LINK, parameters={"amount": 2500.0})
    ex = RecoveryExecution(
        execution_id="ex_int_2a",
        case_id="case_int_2a",
        policy_decision_id="pd_int_2a",
        action=action,
        status=ExecutionStatus.PENDING,
        idempotency_key="ik_int_2a",
    )

    res = provider.execute_action(ex)
    assert res.status in (ProviderExecutionStatus.ACCEPTED, ProviderExecutionStatus.COMPLETED)
    assert res.provider_reference == "plink_int_2a"

    # 3. Webhook Normalization
    normalizer = RazorpayWebhookNormalizer()
    webhook_payload = {
        "event": "payment_link.paid",
        "event_id": "evt_int_2a",
        "payload": {"payment_link": {"entity": {"id": "plink_int_2a", "amount": 250000}}},
    }
    evt = normalizer.normalize(webhook_payload)
    assert evt is not None
    assert evt.event_type == EventType.RECOVERY_JOB_COMPLETED
    assert evt.aggregate_id == "plink_int_2a"
