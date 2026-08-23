from dataclasses import dataclass
from decimal import Decimal
from typing import Optional
from app.repository.interfaces import (
    RecoveryCaseRepository,
    PaymentRepository,
    RecoveryAttemptRepository,
    RecoveryExecutionRepository,
    RecoveryJobRepository,
)


@dataclass(frozen=True)
class RecoveryOperationalMetrics:
    total_cases: int
    active_cases: int
    recovered_cases: int
    failed_cases: int
    escalated_cases: int
    stopped_cases: int
    total_executions: int
    successful_executions: int
    failed_executions: int
    retry_scheduled_jobs: int
    dead_letter_jobs: int
    policy_rejections: int
    average_attempts: float
    recovery_rate: float
    execution_success_rate: float
    revenue_at_risk: Decimal
    revenue_recovered: Decimal


class RecoveryMetricsService:
    """Aggregates domain-level operational metrics using repository abstractions."""

    def __init__(
        self,
        case_repo: RecoveryCaseRepository,
        payment_repo: PaymentRepository,
        attempt_repo: Optional[RecoveryAttemptRepository] = None,
        execution_repo: Optional[RecoveryExecutionRepository] = None,
        job_repo: Optional[RecoveryJobRepository] = None,
    ) -> None:
        self.case_repo = case_repo
        self.payment_repo = payment_repo
        self.attempt_repo = attempt_repo
        self.execution_repo = execution_repo
        self.job_repo = job_repo

    def get_metrics(self) -> RecoveryOperationalMetrics:
        active_cases_list = self.case_repo.list_active_cases()
        
        # Aggregate statistics using repository interfaces
        total_cases = len(active_cases_list)
        active_cases = 0
        recovered_cases = 0
        failed_cases = 0
        escalated_cases = 0
        stopped_cases = 0
        revenue_at_risk = Decimal("0.00")
        revenue_recovered = Decimal("0.00")

        total_attempts = 0

        for case_item in active_cases_list:
            state = getattr(case_item, "state", "DETECTED")
            total_attempts += getattr(case_item, "attempt_count", 0)

            payment = self.payment_repo.get_by_id(case_item.payment_id)
            if payment:
                amt = Decimal(str(payment.amount))
                revenue_at_risk += amt
                if state == "RECOVERED":
                    revenue_recovered += amt

            if state == "RECOVERED":
                recovered_cases += 1
            elif state == "FAILED":
                failed_cases += 1
            elif state == "ESCALATED":
                escalated_cases += 1
            elif state == "STOPPED":
                stopped_cases += 1
            else:
                active_cases += 1

        avg_attempts = float(total_attempts / total_cases) if total_cases > 0 else 0.0
        rec_rate = float(recovered_cases / total_cases * 100.0) if total_cases > 0 else 0.0

        # Execution provider & job stats (default safe values if repos not supplied)
        total_executions = 0
        successful_executions = 0
        failed_executions = 0
        retry_scheduled_jobs = 0
        dead_letter_jobs = 0
        policy_rejections = 0

        exec_success_rate = (
            float(successful_executions / total_executions * 100.0) if total_executions > 0 else 0.0
        )

        return RecoveryOperationalMetrics(
            total_cases=total_cases,
            active_cases=active_cases,
            recovered_cases=recovered_cases,
            failed_cases=failed_cases,
            escalated_cases=escalated_cases,
            stopped_cases=stopped_cases,
            total_executions=total_executions,
            successful_executions=successful_executions,
            failed_executions=failed_executions,
            retry_scheduled_jobs=retry_scheduled_jobs,
            dead_letter_jobs=dead_letter_jobs,
            policy_rejections=policy_rejections,
            average_attempts=avg_attempts,
            recovery_rate=rec_rate,
            execution_success_rate=exec_success_rate,
            revenue_at_risk=revenue_at_risk,
            revenue_recovered=revenue_recovered,
        )
