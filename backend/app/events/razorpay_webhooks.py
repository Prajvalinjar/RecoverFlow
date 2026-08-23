import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from app.events.event import RecoveryEvent, EventType

logger = logging.getLogger("recoverflow.events.razorpay_webhooks")


class RazorpayWebhookNormalizer:
    """Normalizes raw Razorpay webhook payloads into structured internal RecoveryEvent objects.

    Supported events:
      - payment.authorized
      - payment.failed
      - payment.captured
      - payment_link.paid
      - refund.created
    """

    EVENT_MAPPING = {
        "payment.authorized": EventType.PAYMENT_FAILURE_RECEIVED,
        "payment.failed": EventType.PAYMENT_FAILURE_RECEIVED,
        "payment.captured": EventType.RECOVERY_JOB_COMPLETED,
        "payment_link.paid": EventType.RECOVERY_JOB_COMPLETED,
        "refund.created": EventType.RECONCILIATION_REQUIRED,
    }

    def normalize(self, raw_payload: Dict[str, Any], correlation_id: Optional[str] = None) -> Optional[RecoveryEvent]:
        if not isinstance(raw_payload, dict):
            logger.warning("Invalid raw_payload type received for Razorpay webhook: %s", type(raw_payload))
            return None

        event_name = raw_payload.get("event", "")
        evt_type = self.EVENT_MAPPING.get(event_name)

        if not evt_type:
            logger.info("Razorpay event '%s' ignored or unsupported for recovery loop.", event_name)
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

        normalized_payload = {
            "razorpay_event_id": rzp_event_id,
            "razorpay_event": event_name,
            "payment_id": payment_id,
            "customer_id": customer_id,
            "amount": amount_paisa / 100.0,
            "currency": currency,
            "failure_code": failure_code,
            "error_description": entity_obj.get("error_description", ""),
            "raw_status": entity_obj.get("status"),
            "created_at": raw_payload.get("created_at"),
        }

        return RecoveryEvent(
            event_id=rzp_event_id,
            event_type=evt_type,
            aggregate_id=payment_id,
            case_id="",
            payment_id=payment_id,
            payload=normalized_payload,
            timestamp=datetime.now(timezone.utc),
            correlation_id=corr,
        )
