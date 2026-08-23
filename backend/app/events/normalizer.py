from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import logging
import uuid

from app.events.event import RecoveryEvent, EventType

logger = logging.getLogger("recoverflow.events.normalizer")


@dataclass(frozen=True)
class NormalizedWebhookPayload:
    """Standardized provider-neutral webhook event structure."""
    provider_event_id: str
    provider: str
    event_type: str
    occurred_at: datetime
    correlation_id: str
    payment_id: str
    customer_id: str
    provider_reference: str
    normalized_event_type: EventType
    amount: float = 0.0
    currency: str = "INR"
    failure_code: Optional[str] = None
    raw_payload: Dict[str, Any] = field(default_factory=dict)

    def to_domain_event(self) -> RecoveryEvent:

        return RecoveryEvent(
            event_id=self.provider_event_id,
            event_type=self.normalized_event_type,
            aggregate_id=self.payment_id,
            case_id="",
            payment_id=self.payment_id,
            payload={
                "provider_event_id": self.provider_event_id,
                "provider": self.provider,
                "event_type": self.event_type,
                "payment_id": self.payment_id,
                "customer_id": self.customer_id,
                "provider_reference": self.provider_reference,
                "amount": self.amount,
                "currency": self.currency,
                "failure_code": self.failure_code,
            },
            timestamp=self.occurred_at,
            correlation_id=self.correlation_id,
        )


class ProviderWebhookNormalizer(ABC):
    """Abstract provider webhook normalizer contract."""

    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def normalize(
        self, raw_payload: Dict[str, Any], correlation_id: Optional[str] = None
    ) -> Optional[NormalizedWebhookPayload]:
        pass


class RazorpayWebhookNormalizer(ProviderWebhookNormalizer):
    """Razorpay provider-neutral webhook normalizer implementation."""

    EVENT_MAPPING = {
        "payment.authorized": EventType.PAYMENT_FAILURE_RECEIVED,
        "payment.failed": EventType.PAYMENT_FAILURE_RECEIVED,
        "payment.captured": EventType.RECOVERY_JOB_COMPLETED,
        "payment_link.paid": EventType.RECOVERY_JOB_COMPLETED,
        "payment_link.expired": EventType.RECOVERY_CASE_STOPPED,
        "payment_link.cancelled": EventType.RECOVERY_CASE_STOPPED,
        "refund.created": EventType.RECONCILIATION_REQUIRED,
    }

    def provider_name(self) -> str:
        return "razorpay"

    def normalize(
        self, raw_payload: Dict[str, Any], correlation_id: Optional[str] = None
    ) -> Optional[NormalizedWebhookPayload]:
        if not isinstance(raw_payload, dict):
            logger.warning("Invalid raw_payload type for Razorpay webhook: %s", type(raw_payload))
            return None

        event_name = raw_payload.get("event", "")
        norm_type = self.EVENT_MAPPING.get(event_name)

        if not norm_type:
            logger.info("Razorpay event '%s' ignored or unsupported.", event_name)
            return None

        contains = raw_payload.get("payload", {})
        entity_obj = {}

        if "payment" in contains:
            entity_obj = contains["payment"].get("entity", {})
        elif "payment_link" in contains:
            entity_obj = contains["payment_link"].get("entity", {})
        elif "refund" in contains:
            entity_obj = contains["refund"].get("entity", {})

        rzp_event_id = raw_payload.get("event_id") or f"evt_rzp_{uuid.uuid4().hex[:12]}"
        payment_id = entity_obj.get("id") or entity_obj.get("payment_id", "pay_unknown")
        customer_id = entity_obj.get("customer_id") or "cust_unknown"
        amount_paisa = entity_obj.get("amount", 0)
        currency = entity_obj.get("currency", "INR")
        failure_code = entity_obj.get("error_code") or entity_obj.get("internal_error_code") or "BANK_TIMEOUT"
        corr = correlation_id or f"corr_wh_{uuid.uuid4().hex[:12]}"
        occurred = datetime.now(timezone.utc)

        return NormalizedWebhookPayload(
            provider_event_id=rzp_event_id,
            provider=self.provider_name(),
            event_type=event_name,
            occurred_at=occurred,
            correlation_id=corr,
            payment_id=payment_id,
            customer_id=customer_id,
            provider_reference=payment_id,
            normalized_event_type=norm_type,
            amount=amount_paisa / 100.0,
            currency=currency,
            failure_code=failure_code,
            raw_payload=raw_payload,
        )


class SimulatedWebhookNormalizer(ProviderWebhookNormalizer):
    """Simulated provider-neutral webhook normalizer implementation."""

    def provider_name(self) -> str:
        return "simulated"

    def normalize(
        self, raw_payload: Dict[str, Any], correlation_id: Optional[str] = None
    ) -> Optional[NormalizedWebhookPayload]:
        if not isinstance(raw_payload, dict):
            return None

        event_name = raw_payload.get("event_type") or raw_payload.get("event", "payment.failed")
        evt_id = raw_payload.get("event_id") or f"evt_sim_{uuid.uuid4().hex[:12]}"
        payment_id = raw_payload.get("payment_id", "pay_sim_default")
        customer_id = raw_payload.get("customer_id", "cust_sim_default")
        corr = correlation_id or raw_payload.get("correlation_id") or f"corr_sim_{uuid.uuid4().hex[:12]}"

        norm_type = EventType.PAYMENT_FAILURE_RECEIVED
        if "success" in event_name.lower() or "captured" in event_name.lower() or "paid" in event_name.lower():
            norm_type = EventType.RECOVERY_JOB_COMPLETED
        elif "refund" in event_name.lower():
            norm_type = EventType.RECONCILIATION_REQUIRED

        return NormalizedWebhookPayload(
            provider_event_id=evt_id,
            provider=self.provider_name(),
            event_type=event_name,
            occurred_at=datetime.now(timezone.utc),
            correlation_id=corr,
            payment_id=payment_id,
            customer_id=customer_id,
            provider_reference=payment_id,
            normalized_event_type=norm_type,
            amount=float(raw_payload.get("amount", 100.0)),
            currency=raw_payload.get("currency", "INR"),
            failure_code=raw_payload.get("failure_code", "SIMULATED_FAILURE"),
            raw_payload=raw_payload,
        )


def get_webhook_normalizer(provider_name: str) -> ProviderWebhookNormalizer:
    if provider_name.lower() == "razorpay":
        return RazorpayWebhookNormalizer()
    return SimulatedWebhookNormalizer()
