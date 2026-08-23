from decimal import Decimal
from typing import Dict, List, Optional

from app.data.models import SyntheticDataset
from app.simulation.executor import SimulatedRecoveryExecutor
from app.benchmark.baseline import (
    BaselineStrategy,
    NoRecoveryBaseline,
    BlindRetryBaseline,
    RepeatedRetryBaseline,
    RecoverFlowStrategy,
    StrategyCaseResult,
)
from app.benchmark.metrics import BenchmarkMetrics


class BenchmarkRunner:
    """Deterministic Multi-Strategy Benchmark Runner.
    
    Responsibilities:
    - Runs multiple baseline strategies against a SyntheticDataset.
    - Enforces state isolation between strategies (separate isolated executor instances).
    - Prevents mutation of the source dataset.
    - Aggregates per-case results into validated BenchmarkMetrics.
    """

    def __init__(self, strategies: Optional[List[BaselineStrategy]] = None) -> None:
        self.strategies = strategies or [
            NoRecoveryBaseline(),
            BlindRetryBaseline(),
            RepeatedRetryBaseline(),
            RecoverFlowStrategy(),
        ]

    def run(self, dataset: SyntheticDataset) -> Dict[str, BenchmarkMetrics]:
        """Runs all configured strategies against the dataset and returns compiled metrics."""
        results: Dict[str, BenchmarkMetrics] = {}

        # Lookup maps for fast relational joining
        customer_map = {c.customer_id: c for c in dataset.customers}
        payment_map = {p.payment_id: p for p in dataset.payments}

        for strategy in self.strategies:
            # Enforce state isolation per strategy using a clean SimulatedRecoveryExecutor instance
            isolated_executor = SimulatedRecoveryExecutor()
            case_results: List[StrategyCaseResult] = []

            for case in dataset.recovery_cases:
                customer = customer_map[case.customer_id]
                payment = payment_map[case.payment_id]

                # Run strategy on isolated copy
                case_res = strategy.run_case(customer, payment, case, executor=isolated_executor)
                case_results.append(case_res)

            # Calculate aggregated metrics for this strategy
            metrics = self._calculate_metrics(strategy.name, dataset, case_results)
            results[strategy.name] = metrics

        return results

    def _calculate_metrics(
        self,
        strategy_name: str,
        dataset: SyntheticDataset,
        case_results: List[StrategyCaseResult],
    ) -> BenchmarkMetrics:
        total_cases = len(case_results)
        if total_cases == 0:
            return BenchmarkMetrics(
                strategy_name=strategy_name,
                total_cases=0,
                recovered_cases=0,
                failed_cases=0,
                recovery_rate=0.0,
                total_failed_revenue=Decimal("0.00"),
                total_recovered_revenue=Decimal("0.00"),
                recovery_revenue_percentage=0.0,
                average_attempts_per_case=0.0,
                execution_count=0,
                policy_rejection_count=0,
                stopped_cases=0,
                escalated_cases=0,
            )

        recovered_cases = sum(1 for r in case_results if r.is_recovered)
        failed_cases = total_cases - recovered_cases
        recovery_rate = float(recovered_cases / total_cases)

        total_failed_revenue = dataset.total_failed_amount
        total_recovered_revenue = sum((r.amount_recovered for r in case_results if r.is_recovered), Decimal("0.00"))

        if total_failed_revenue == Decimal("0.00"):
            revenue_pct = 0.0
        else:
            revenue_pct = float((total_recovered_revenue / total_failed_revenue) * Decimal("100.0"))

        total_attempts = sum(r.attempts_count for r in case_results)
        avg_attempts = float(total_attempts / total_cases)

        total_executions = sum(r.execution_count for r in case_results)
        total_policy_rejections = sum(r.policy_rejection_count for r in case_results)
        total_stopped = sum(1 for r in case_results if r.is_stopped)
        total_escalated = sum(1 for r in case_results if r.is_escalated)

        return BenchmarkMetrics(
            strategy_name=strategy_name,
            total_cases=total_cases,
            recovered_cases=recovered_cases,
            failed_cases=failed_cases,
            recovery_rate=round(recovery_rate, 4),
            total_failed_revenue=total_failed_revenue,
            total_recovered_revenue=total_recovered_revenue,
            recovery_revenue_percentage=round(revenue_pct, 2),
            average_attempts_per_case=round(avg_attempts, 2),
            execution_count=total_executions,
            policy_rejection_count=total_policy_rejections,
            stopped_cases=total_stopped,
            escalated_cases=total_escalated,
        )
