import os
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional, List
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
    is_sandbox_baseline: bool = False
    data_source: str = "LIVE_DATABASE"


# Approved sandbox baseline constants (authoritative buildathon demo values)
SANDBOX_BASELINE_METRICS = RecoveryOperationalMetrics(
    total_cases=1240,
    active_cases=142,
    recovered_cases=921,
    failed_cases=105,
    escalated_cases=72,
    stopped_cases=0,
    total_executions=463,
    successful_executions=347,
    failed_executions=116,
    retry_scheduled_jobs=0,
    dead_letter_jobs=0,
    policy_rejections=0,
    average_attempts=2.68,
    recovery_rate=74.26,
    execution_success_rate=74.95,
    revenue_at_risk=Decimal("245680.00"),
    revenue_recovered=Decimal("182450.00"),
    is_sandbox_baseline=True,
    data_source="SANDBOX_BASELINE",
)

EMPTY_DATABASE_METRICS = RecoveryOperationalMetrics(
    total_cases=0,
    active_cases=0,
    recovered_cases=0,
    failed_cases=0,
    escalated_cases=0,
    stopped_cases=0,
    total_executions=0,
    successful_executions=0,
    failed_executions=0,
    retry_scheduled_jobs=0,
    dead_letter_jobs=0,
    policy_rejections=0,
    average_attempts=0.0,
    recovery_rate=0.0,
    execution_success_rate=0.0,
    revenue_at_risk=Decimal("0.00"),
    revenue_recovered=Decimal("0.00"),
    is_sandbox_baseline=False,
    data_source="EMPTY_DATABASE",
)


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
        # Load data mode configuration
        mode = os.getenv("RECOVERFLOW_DATA_MODE", "AUTO").strip().upper()
        seed_enabled = os.getenv("RECOVERFLOW_SEED_SANDBOX", "false").strip().lower() == "true"

        # Query all cases if available, otherwise fall back to active cases
        if hasattr(self.case_repo, "list_all_cases"):
            cases_list = self.case_repo.list_all_cases()
        else:
            cases_list = self.case_repo.list_active_cases()

        total_cases = len(cases_list)

        # Inspect source attribution of cases in database
        has_genuine_records = any(
            getattr(c, "data_source", None) not in ("SANDBOX_SEED", "SANDBOX_BASELINE")
            for c in cases_list
        )
        all_seeded_records = total_cases > 0 and all(
            getattr(c, "data_source", None) in ("SANDBOX_SEED", "SANDBOX_BASELINE")
            for c in cases_list
        )

        # 1. Explicit SANDBOX mode
        if mode == "SANDBOX":
            source = "SANDBOX_SEED" if all_seeded_records else "SANDBOX_BASELINE"
            return RecoveryOperationalMetrics(
                total_cases=SANDBOX_BASELINE_METRICS.total_cases,
                active_cases=SANDBOX_BASELINE_METRICS.active_cases,
                recovered_cases=SANDBOX_BASELINE_METRICS.recovered_cases,
                failed_cases=SANDBOX_BASELINE_METRICS.failed_cases,
                escalated_cases=SANDBOX_BASELINE_METRICS.escalated_cases,
                stopped_cases=SANDBOX_BASELINE_METRICS.stopped_cases,
                total_executions=SANDBOX_BASELINE_METRICS.total_executions,
                successful_executions=SANDBOX_BASELINE_METRICS.successful_executions,
                failed_executions=SANDBOX_BASELINE_METRICS.failed_executions,
                retry_scheduled_jobs=SANDBOX_BASELINE_METRICS.retry_scheduled_jobs,
                dead_letter_jobs=SANDBOX_BASELINE_METRICS.dead_letter_jobs,
                policy_rejections=SANDBOX_BASELINE_METRICS.policy_rejections,
                average_attempts=SANDBOX_BASELINE_METRICS.average_attempts,
                recovery_rate=SANDBOX_BASELINE_METRICS.recovery_rate,
                execution_success_rate=SANDBOX_BASELINE_METRICS.execution_success_rate,
                revenue_at_risk=SANDBOX_BASELINE_METRICS.revenue_at_risk,
                revenue_recovered=SANDBOX_BASELINE_METRICS.revenue_recovered,
                is_sandbox_baseline=True,
                data_source=source,
            )

        # 2. Explicit LIVE mode
        if mode == "LIVE":
            if total_cases == 0:
                return EMPTY_DATABASE_METRICS
            return self._compute_live_metrics(cases_list, data_source="LIVE_DATABASE")

        # 3. AUTO mode (Default)
        if has_genuine_records:
            return self._compute_live_metrics(cases_list, data_source="LIVE_DATABASE")

        if all_seeded_records:
            return RecoveryOperationalMetrics(
                total_cases=SANDBOX_BASELINE_METRICS.total_cases,
                active_cases=SANDBOX_BASELINE_METRICS.active_cases,
                recovered_cases=SANDBOX_BASELINE_METRICS.recovered_cases,
                failed_cases=SANDBOX_BASELINE_METRICS.failed_cases,
                escalated_cases=SANDBOX_BASELINE_METRICS.escalated_cases,
                stopped_cases=SANDBOX_BASELINE_METRICS.stopped_cases,
                total_executions=SANDBOX_BASELINE_METRICS.total_executions,
                successful_executions=SANDBOX_BASELINE_METRICS.successful_executions,
                failed_executions=SANDBOX_BASELINE_METRICS.failed_executions,
                retry_scheduled_jobs=SANDBOX_BASELINE_METRICS.retry_scheduled_jobs,
                dead_letter_jobs=SANDBOX_BASELINE_METRICS.dead_letter_jobs,
                policy_rejections=SANDBOX_BASELINE_METRICS.policy_rejections,
                average_attempts=SANDBOX_BASELINE_METRICS.average_attempts,
                recovery_rate=SANDBOX_BASELINE_METRICS.recovery_rate,
                execution_success_rate=SANDBOX_BASELINE_METRICS.execution_success_rate,
                revenue_at_risk=SANDBOX_BASELINE_METRICS.revenue_at_risk,
                revenue_recovered=SANDBOX_BASELINE_METRICS.revenue_recovered,
                is_sandbox_baseline=True,
                data_source="SANDBOX_SEED",
            )

        # Database is completely empty
        if seed_enabled:
            return SANDBOX_BASELINE_METRICS

        return EMPTY_DATABASE_METRICS

    def _compute_live_metrics(self, cases_list: List[Any], data_source: str) -> RecoveryOperationalMetrics:
        """Compute authoritative metrics across database records."""
        total_cases = len(cases_list)
        active_cases = 0
        recovered_cases = 0
        failed_cases = 0
        escalated_cases = 0
        stopped_cases = 0
        revenue_at_risk = Decimal("0.00")
        revenue_recovered = Decimal("0.00")
        total_attempts = 0

        for case_item in cases_list:
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
            is_sandbox_baseline=False,
            data_source=data_source,
        )
