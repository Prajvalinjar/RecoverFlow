from decimal import Decimal
from datetime import datetime, timedelta
from typing import Tuple

from app.domain.payment import PaymentStatus, FailureCode
from app.domain.recovery_case import CaseState, CasePriority
from app.data.models import (
    CustomerSegment,
    SyntheticCustomer,
    SyntheticPayment,
    SyntheticRecoveryCase,
)


class BenchmarkScenarioLibrary:
    """Pre-packaged benchmark scenario library representing canonical fintech failure patterns."""

    @staticmethod
    def scenario_a_high_recovery_potential() -> Tuple[SyntheticCustomer, SyntheticPayment, SyntheticRecoveryCase]:
        """Scenario A: Premium customer + Bank Timeout + 0 previous retries."""
        customer = SyntheticCustomer(
            customer_id="cust_scen_a",
            segment=CustomerSegment.PREMIUM,
            historical_payment_count=30,
            historical_success_count=29,
            historical_failure_count=1,
            average_payment_delay=2.0,
            previous_recovery_attempts=2,
            previous_recovery_successes=2,
            total_spent=Decimal("85000.00"),
        )
        payment = SyntheticPayment(
            payment_id="pay_scen_a",
            customer_id=customer.customer_id,
            amount=Decimal("4999.00"),
            status=PaymentStatus.FAILED,
            failure_code=FailureCode.BANK_TIMEOUT,
            failure_reason="Gateway timeout during checkout",
        )
        case = SyntheticRecoveryCase(
            case_id="case_scen_a",
            payment_id=payment.payment_id,
            customer_id=customer.customer_id,
            amount=payment.amount,
            failure_code=payment.failure_code,
            state=CaseState.DETECTED,
            priority=CasePriority.MEDIUM,
            attempts_count=0,
            max_allowed_attempts=3,
        )
        return customer, payment, case

    @staticmethod
    def scenario_b_multi_step_retry_failed() -> Tuple[SyntheticCustomer, SyntheticPayment, SyntheticRecoveryCase]:
        """Scenario B: Regular customer + Insufficient Funds + 1 failed retry attempt."""
        customer = SyntheticCustomer(
            customer_id="cust_scen_b",
            segment=CustomerSegment.REGULAR,
            historical_payment_count=15,
            historical_success_count=13,
            historical_failure_count=2,
            average_payment_delay=6.0,
            previous_recovery_attempts=1,
            previous_recovery_successes=1,
            total_spent=Decimal("25000.00"),
        )
        payment = SyntheticPayment(
            payment_id="pay_scen_b",
            customer_id=customer.customer_id,
            amount=Decimal("2500.00"),
            status=PaymentStatus.FAILED,
            failure_code=FailureCode.INSUFFICIENT_FUNDS,
            failure_reason="Insufficient balance",
            attempt_number=1,
        )
        case = SyntheticRecoveryCase(
            case_id="case_scen_b",
            payment_id=payment.payment_id,
            customer_id=customer.customer_id,
            amount=payment.amount,
            failure_code=payment.failure_code,
            state=CaseState.FAILED,
            priority=CasePriority.MEDIUM,
            attempts_count=1,
            max_allowed_attempts=3,
            last_attempt_at=datetime.now() - timedelta(minutes=10),
        )
        return customer, payment, case

    @staticmethod
    def scenario_c_poor_customer_history() -> Tuple[SyntheticCustomer, SyntheticPayment, SyntheticRecoveryCase]:
        """Scenario C: At-risk customer + Card Decline + high failure history."""
        customer = SyntheticCustomer(
            customer_id="cust_scen_c",
            segment=CustomerSegment.AT_RISK,
            historical_payment_count=20,
            historical_success_count=4,
            historical_failure_count=16,
            average_payment_delay=24.0,
            previous_recovery_attempts=5,
            previous_recovery_successes=1,
            total_spent=Decimal("5000.00"),
        )
        payment = SyntheticPayment(
            payment_id="pay_scen_c",
            customer_id=customer.customer_id,
            amount=Decimal("15000.00"),
            status=PaymentStatus.FAILED,
            failure_code=FailureCode.CARD_DECLINED,
            failure_reason="Card decline by issuer",
        )
        case = SyntheticRecoveryCase(
            case_id="case_scen_c",
            payment_id=payment.payment_id,
            customer_id=customer.customer_id,
            amount=payment.amount,
            failure_code=payment.failure_code,
            state=CaseState.DETECTED,
            priority=CasePriority.MEDIUM,
            attempts_count=1,
            max_allowed_attempts=3,
        )
        return customer, payment, case

    @staticmethod
    def scenario_d_retry_exhaustion() -> Tuple[SyntheticCustomer, SyntheticPayment, SyntheticRecoveryCase]:
        """Scenario D: Retries exhausted (attempts_count == 3 >= max_allowed_attempts)."""
        customer = SyntheticCustomer(
            customer_id="cust_scen_d",
            segment=CustomerSegment.REGULAR,
            historical_payment_count=10,
            historical_success_count=8,
            historical_failure_count=2,
        )
        payment = SyntheticPayment(
            payment_id="pay_scen_d",
            customer_id=customer.customer_id,
            amount=Decimal("1000.00"),
            status=PaymentStatus.FAILED,
            failure_code=FailureCode.INSUFFICIENT_FUNDS,
        )
        case = SyntheticRecoveryCase(
            case_id="case_scen_d",
            payment_id=payment.payment_id,
            customer_id=customer.customer_id,
            amount=payment.amount,
            failure_code=payment.failure_code,
            state=CaseState.FAILED,
            attempts_count=3,
            max_allowed_attempts=3,
        )
        return customer, payment, case

    @staticmethod
    def scenario_e_high_value_payment_risk() -> Tuple[SyntheticCustomer, SyntheticPayment, SyntheticRecoveryCase]:
        """Scenario E: Large payment amount (₹150,000 > ₹100,000 threshold)."""
        customer = SyntheticCustomer(
            customer_id="cust_scen_e",
            segment=CustomerSegment.HIGH_VALUE,
            historical_payment_count=25,
            historical_success_count=24,
            historical_failure_count=1,
            total_spent=Decimal("500000.00"),
        )
        payment = SyntheticPayment(
            payment_id="pay_scen_e",
            customer_id=customer.customer_id,
            amount=Decimal("150000.00"),
            status=PaymentStatus.FAILED,
            failure_code=FailureCode.BANK_TIMEOUT,
        )
        case = SyntheticRecoveryCase(
            case_id="case_scen_e",
            payment_id=payment.payment_id,
            customer_id=customer.customer_id,
            amount=payment.amount,
            failure_code=payment.failure_code,
            state=CaseState.DETECTED,
            priority=CasePriority.CRITICAL,
            attempts_count=0,
            max_allowed_attempts=3,
        )
        return customer, payment, case

    @staticmethod
    def scenario_f_cooldown_required() -> Tuple[SyntheticCustomer, SyntheticPayment, SyntheticRecoveryCase]:
        """Scenario F: Retry attempted too recently (20s ago < 300s cooldown)."""
        customer = SyntheticCustomer(
            customer_id="cust_scen_f",
            segment=CustomerSegment.REGULAR,
            historical_payment_count=12,
            historical_success_count=10,
            historical_failure_count=2,
        )
        payment = SyntheticPayment(
            payment_id="pay_scen_f",
            customer_id=customer.customer_id,
            amount=Decimal("2000.00"),
            status=PaymentStatus.FAILED,
            failure_code=FailureCode.INSUFFICIENT_FUNDS,
        )
        case = SyntheticRecoveryCase(
            case_id="case_scen_f",
            payment_id=payment.payment_id,
            customer_id=customer.customer_id,
            amount=payment.amount,
            failure_code=payment.failure_code,
            state=CaseState.DETECTED,
            attempts_count=1,
            max_allowed_attempts=3,
            last_attempt_at=datetime.now() - timedelta(seconds=20),
        )
        return customer, payment, case

    @staticmethod
    def scenario_g_terminal_case() -> Tuple[SyntheticCustomer, SyntheticPayment, SyntheticRecoveryCase]:
        """Scenario G: Case already in terminal state RECOVERED."""
        customer = SyntheticCustomer(
            customer_id="cust_scen_g",
            segment=CustomerSegment.PREMIUM,
            historical_payment_count=15,
            historical_success_count=15,
        )
        payment = SyntheticPayment(
            payment_id="pay_scen_g",
            customer_id=customer.customer_id,
            amount=Decimal("3000.00"),
            status=PaymentStatus.SUCCESS,
        )
        case = SyntheticRecoveryCase(
            case_id="case_scen_g",
            payment_id=payment.payment_id,
            customer_id=customer.customer_id,
            amount=payment.amount,
            state=CaseState.RECOVERED,
            attempts_count=1,
        )
        return customer, payment, case

    @staticmethod
    def scenario_h_new_customer_uncertainty() -> Tuple[SyntheticCustomer, SyntheticPayment, SyntheticRecoveryCase]:
        """Scenario H: New customer with zero prior history."""
        customer = SyntheticCustomer(
            customer_id="cust_scen_h",
            segment=CustomerSegment.NEW,
            historical_payment_count=1,
            historical_success_count=0,
            historical_failure_count=1,
            previous_recovery_attempts=0,
            total_spent=Decimal("1500.00"),
        )
        payment = SyntheticPayment(
            payment_id="pay_scen_h",
            customer_id=customer.customer_id,
            amount=Decimal("1500.00"),
            status=PaymentStatus.FAILED,
            failure_code=FailureCode.NETWORK_FAILURE,
        )
        case = SyntheticRecoveryCase(
            case_id="case_scen_h",
            payment_id=payment.payment_id,
            customer_id=customer.customer_id,
            amount=payment.amount,
            failure_code=payment.failure_code,
            state=CaseState.DETECTED,
            attempts_count=0,
        )
        return customer, payment, case
