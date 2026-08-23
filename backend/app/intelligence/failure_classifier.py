from enum import Enum
from typing import Optional
from dataclasses import dataclass

from app.domain.payment import Payment, FailureCode


class FailureCategory(str, Enum):
    TEMPORARY = "TEMPORARY"
    LIMIT_OR_FUNDS = "LIMIT_OR_FUNDS"
    PAYMENT_METHOD_ISSUE = "PAYMENT_METHOD_ISSUE"
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    SYSTEM_OR_PROCESSING = "SYSTEM_OR_PROCESSING"
    UNKNOWN = "UNKNOWN"


class FailureSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass(frozen=True)
class FailureClassification:
    """Structured interpretation of payment failure code and semantics."""
    category: FailureCategory
    severity: FailureSeverity
    recoverability_hint: str
    explanation: str


class FailureClassifier:
    """Deterministic classifier interpreting Payment failure codes into structured semantic categories."""

    def classify(self, payment: Payment) -> FailureClassification:
        code = payment.failure_code

        if code == FailureCode.INSUFFICIENT_FUNDS:
            return FailureClassification(
                category=FailureCategory.LIMIT_OR_FUNDS,
                severity=FailureSeverity.MEDIUM,
                recoverability_hint="Customer may add funds or retry after delay.",
                explanation="Account balance was insufficient at the time of payment processing.",
            )
        elif code == FailureCode.BANK_TIMEOUT:
            return FailureClassification(
                category=FailureCategory.TEMPORARY,
                severity=FailureSeverity.LOW,
                recoverability_hint="High likelihood of recovery via immediate or delayed retry.",
                explanation="Intermittent banking gateway timeout occurred during processing.",
            )
        elif code == FailureCode.NETWORK_FAILURE:
            return FailureClassification(
                category=FailureCategory.TEMPORARY,
                severity=FailureSeverity.LOW,
                recoverability_hint="Retry recommended once network connectivity stabilizes.",
                explanation="Transient network transport disruption prevented transaction completion.",
            )
        elif code == FailureCode.CARD_DECLINED:
            return FailureClassification(
                category=FailureCategory.PAYMENT_METHOD_ISSUE,
                severity=FailureSeverity.HIGH,
                recoverability_hint="Customer payment link or method update recommended.",
                explanation="Payment gateway received an explicit card decline from the issuing bank.",
            )
        elif code == FailureCode.AUTHENTICATION_FAILURE:
            return FailureClassification(
                category=FailureCategory.AUTHENTICATION_REQUIRED,
                severity=FailureSeverity.MEDIUM,
                recoverability_hint="Customer payment reminder or direct authentication link recommended.",
                explanation="Strong Customer Authentication (3DS/OTP) challenge failed or timed out.",
            )
        elif code == FailureCode.TEMPORARY_DEGRADATION:
            return FailureClassification(
                category=FailureCategory.SYSTEM_OR_PROCESSING,
                severity=FailureSeverity.MEDIUM,
                recoverability_hint="Retry after payment gateway degradation resolves.",
                explanation="Payment processor reported temporary system degradation.",
            )
        else:
            return FailureClassification(
                category=FailureCategory.UNKNOWN,
                severity=FailureSeverity.MEDIUM,
                recoverability_hint="Contextual analysis required.",
                explanation=payment.failure_reason or "Unclassified payment failure code.",
            )
