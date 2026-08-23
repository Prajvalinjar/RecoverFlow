from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

from app.domain.payment import FailureCode


class PaymentFailureEvent(BaseModel):
    """Production payment failure event payload schema."""
    event_id: str = Field(..., description="Unique provider event identifier (e.g. evt_12345)")
    event_type: str = Field(default="payment.failed", description="Event type string")
    payment_id: str = Field(..., description="Payment transaction identifier")
    customer_id: str = Field(..., description="Customer identifier")
    amount: Decimal = Field(..., description="Monetary transaction amount (> 0)")
    currency: str = Field(default="INR", description="Currency code (e.g. INR)")
    failure_code: str = Field(..., description="Failure code mapping to FailureCode domain enum")
    occurred_at: datetime = Field(default_factory=datetime.utcnow, description="Event occurrence timestamp")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Optional metadata payload")

    @field_validator("event_id", "payment_id", "customer_id")
    def validate_non_empty_strings(cls, v: str, info) -> str:
        if not v or not v.strip():
            raise ValueError(f"{info.field_name} cannot be empty.")
        return v.strip()

    @field_validator("amount")
    def validate_amount_positive(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("Payment amount must be greater than zero.")
        return v

    @field_validator("currency")
    def validate_currency(cls, v: str) -> str:
        valid_currencies = {"INR", "USD", "EUR", "GBP"}
        upper_v = v.upper()
        if upper_v not in valid_currencies:
            raise ValueError(f"Unsupported currency: {v}. Must be one of {valid_currencies}")
        return upper_v

    @field_validator("failure_code")
    def validate_failure_code(cls, v: str) -> str:
        valid_codes = {fc.value for fc in FailureCode}
        if v not in valid_codes:
            raise ValueError(f"Unsupported failure_code: {v}. Supported: {valid_codes}")
        return v


class EventProcessingResponse(BaseModel):
    """Response returned upon processing a payment failure event."""
    status: str = Field(..., description="Processing status: 'accepted' or 'already_processed'")
    provider_event_id: str = Field(..., description="Provider event ID")
    payment_id: str = Field(..., description="Payment ID")
    customer_id: str = Field(..., description="Customer ID")
    case_id: Optional[str] = Field(None, description="Associated RecoveryCase ID")
    duplicate: bool = Field(..., description="True if duplicate event was detected")
    message: Optional[str] = Field(None, description="Detailed processing status message")
