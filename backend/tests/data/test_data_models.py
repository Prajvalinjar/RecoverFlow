from decimal import Decimal
from datetime import datetime
import pytest

from app.domain.customer import CustomerContext
from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.recovery_case import RecoveryCase, CaseState
from app.data.models import (
    CustomerSegment,
    SyntheticCustomer,
    SyntheticPayment,
    SyntheticRecoveryCase,
    SyntheticRecoveryAttempt,
    SyntheticDataset,
)


def test_customer_model_validation() -> None:
    customer = SyntheticCustomer(
        customer_id="cust_001",
        segment=CustomerSegment.PREMIUM,
        historical_payment_count=10,
        historical_success_count=9,
        historical_failure_count=1,
        total_spent=Decimal("50000.00"),
    )

    assert customer.historical_success_rate == 0.9
    assert customer.segment == CustomerSegment.PREMIUM

    with pytest.raises(ValueError) as exc_info:
        SyntheticCustomer(
            customer_id="cust_invalid",
            segment=CustomerSegment.REGULAR,
            historical_success_count=-1,
        )
    assert "cannot be negative" in str(exc_info.value)


def test_payment_model_validation() -> None:
    payment = SyntheticPayment(
        payment_id="pay_001",
        customer_id="cust_001",
        amount=Decimal("2500.00"),
        status=PaymentStatus.FAILED,
        failure_code=FailureCode.BANK_TIMEOUT,
    )

    assert payment.amount == Decimal("2500.00")

    with pytest.raises(ValueError) as exc_info:
        SyntheticPayment(
            payment_id="pay_inv",
            customer_id="cust_001",
            amount=Decimal("0.00"),
        )
    assert "greater than zero" in str(exc_info.value)


def test_recovery_case_model() -> None:
    case = SyntheticRecoveryCase(
        case_id="case_001",
        payment_id="pay_001",
        customer_id="cust_001",
        amount=Decimal("2500.00"),
        failure_code=FailureCode.BANK_TIMEOUT,
    )

    assert case.amount == Decimal("2500.00")
    assert case.state == CaseState.DETECTED

    with pytest.raises(ValueError):
        SyntheticRecoveryCase(
            case_id="case_inv",
            payment_id="pay_001",
            customer_id="cust_001",
            amount=Decimal("-100.00"),
        )


def test_domain_conversions() -> None:
    synth_customer = SyntheticCustomer(
        customer_id="cust_conv",
        segment=CustomerSegment.HIGH_VALUE,
        historical_payment_count=20,
        historical_success_count=18,
        historical_failure_count=2,
        total_spent=Decimal("40000.00"),
    )
    domain_cust = synth_customer.to_domain_customer_context()
    assert isinstance(domain_cust, CustomerContext)
    assert domain_cust.customer_id == "cust_conv"
    assert domain_cust.historical_success_count == 18
    assert domain_cust.customer_segment == "HIGH_VALUE"

    synth_payment = SyntheticPayment(
        payment_id="pay_conv",
        customer_id="cust_conv",
        amount=Decimal("5000.00"),
        status=PaymentStatus.FAILED,
        failure_code=FailureCode.INSUFFICIENT_FUNDS,
    )
    domain_pay = synth_payment.to_domain_payment()
    assert isinstance(domain_pay, Payment)
    assert domain_pay.payment_id == "pay_conv"
    assert domain_pay.amount == Decimal("5000.00")
    assert domain_pay.failure_code == FailureCode.INSUFFICIENT_FUNDS

    synth_case = SyntheticRecoveryCase(
        case_id="case_conv",
        payment_id="pay_conv",
        customer_id="cust_conv",
        amount=Decimal("5000.00"),
        failure_code=FailureCode.INSUFFICIENT_FUNDS,
    )
    domain_case = synth_case.to_domain_recovery_case()
    assert isinstance(domain_case, RecoveryCase)
    assert domain_case.case_id == "case_conv"
    assert domain_case.amount_at_risk == Decimal("5000.00")


def test_dataset_validation() -> None:
    cust = SyntheticCustomer(customer_id="cust_1", segment=CustomerSegment.REGULAR)
    pay = SyntheticPayment(payment_id="pay_1", customer_id="cust_1", amount=Decimal("1000.00"))
    case = SyntheticRecoveryCase(case_id="case_1", payment_id="pay_1", customer_id="cust_1", amount=Decimal("1000.00"))

    dataset = SyntheticDataset(seed=123, customers=[cust], payments=[pay], recovery_cases=[case])
    assert len(dataset.customers) == 1
    assert dataset.total_failed_amount == Decimal("1000.00")

    # Test orphan payment rejection
    pay_orphan = SyntheticPayment(payment_id="pay_orph", customer_id="cust_NONEXISTENT", amount=Decimal("100.00"))
    with pytest.raises(ValueError) as exc_info:
        SyntheticDataset(seed=123, customers=[cust], payments=[pay_orphan])
    assert "Orphaned payment" in str(exc_info.value)
