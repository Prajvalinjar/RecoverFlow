from typing import Dict, List, Optional
from app.data.models import (
    SyntheticCustomer,
    SyntheticPayment,
    SyntheticRecoveryCase,
    SyntheticRecoveryAttempt,
    SyntheticDataset,
)
from app.domain.recovery_case import CaseState, TERMINAL_CASE_STATES


class InMemoryRecoveryRepository:
    """In-memory data repository abstraction.
    
    Provides a clean CRUD and query interface for customers, payments, cases, and attempts.
    Establishes the architecture abstraction for future PostgreSQL/Supabase integration.
    """

    def __init__(self) -> None:
        self._customers: Dict[str, SyntheticCustomer] = {}
        self._payments: Dict[str, SyntheticPayment] = {}
        self._cases: Dict[str, SyntheticRecoveryCase] = {}
        self._attempts: Dict[str, List[SyntheticRecoveryAttempt]] = {}

    def load_dataset(self, dataset: SyntheticDataset) -> None:
        """Loads a full synthetic dataset into memory."""
        self.clear()
        for c in dataset.customers:
            self.add_customer(c)
        for p in dataset.payments:
            self.add_payment(p)
        for case in dataset.recovery_cases:
            self.add_case(case)
        for att in dataset.recovery_attempts:
            self.add_attempt(att)

    def add_customer(self, customer: SyntheticCustomer) -> None:
        self._customers[customer.customer_id] = customer

    def get_customer(self, customer_id: str) -> Optional[SyntheticCustomer]:
        return self._customers.get(customer_id)

    def add_payment(self, payment: SyntheticPayment) -> None:
        self._payments[payment.payment_id] = payment

    def get_payment(self, payment_id: str) -> Optional[SyntheticPayment]:
        return self._payments.get(payment_id)

    def get_payments_for_customer(self, customer_id: str) -> List[SyntheticPayment]:
        return [p for p in self._payments.values() if p.customer_id == customer_id]

    def add_case(self, case: SyntheticRecoveryCase) -> None:
        self._cases[case.case_id] = case

    def get_case(self, case_id: str) -> Optional[SyntheticRecoveryCase]:
        return self._cases.get(case_id)

    def get_cases(self) -> List[SyntheticRecoveryCase]:
        return list(self._cases.values())

    def get_recoverable_cases(self) -> List[SyntheticRecoveryCase]:
        return [c for c in self._cases.values() if c.state not in TERMINAL_CASE_STATES and c.attempts_count < c.max_allowed_attempts]

    def add_attempt(self, attempt: SyntheticRecoveryAttempt) -> None:
        if attempt.case_id not in self._attempts:
            self._attempts[attempt.case_id] = []
        self._attempts[attempt.case_id].append(attempt)

    def get_attempts_for_case(self, case_id: str) -> List[SyntheticRecoveryAttempt]:
        return list(self._attempts.get(case_id, []))

    def clear(self) -> None:
        self._customers.clear()
        self._payments.clear()
        self._cases.clear()
        self._attempts.clear()
