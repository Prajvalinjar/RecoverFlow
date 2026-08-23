from typing import Dict, Any, List
from decimal import Decimal
from dataclasses import dataclass, field

from app.benchmark.metrics import BenchmarkMetrics


class BenchmarkReport:
    """Formatter and analyzer for comparative recovery benchmark results.
    
    Responsibilities:
    - Generates comparative summary tables and dictionaries.
    - Identifies top performing strategies based on empirical metrics.
    - Emits factual observations strictly derived from measured metrics.
    - Includes explicit engineering disclaimers regarding synthetic simulation.
    """

    def __init__(self, metrics_by_strategy: Dict[str, BenchmarkMetrics]) -> None:
        self.metrics_by_strategy = metrics_by_strategy

    def get_best_strategy(self) -> str:
        """Determines best strategy by recovery rate."""
        if not self.metrics_by_strategy:
            return "UNKNOWN"
        return max(self.metrics_by_strategy.items(), key=lambda x: (x[1].recovery_rate, x[1].total_recovered_revenue))[0]

    def generate_observations(self) -> List[str]:
        """Generates factual observations strictly derived from measured metrics."""
        observations: List[str] = []
        if not self.metrics_by_strategy:
            return observations

        no_rec = self.metrics_by_strategy.get("No Recovery")
        blind = self.metrics_by_strategy.get("Blind Retry")
        repeated = self.metrics_by_strategy.get("Repeated Retry")
        rf = self.metrics_by_strategy.get("RecoverFlow")

        if rf and blind:
            diff_rate = (rf.recovery_rate - blind.recovery_rate) * 100
            diff_rev = rf.total_recovered_revenue - blind.total_recovered_revenue
            if diff_rate > 0:
                observations.append(
                    f"RecoverFlow achieved a {diff_rate:+.1f}% higher recovery rate than Blind Retry "
                    f"(recovering an additional INR {diff_rev:,.2f})."
                )
            elif diff_rate == 0:
                observations.append("RecoverFlow achieved an equivalent recovery rate to Blind Retry on this dataset.")

        if rf and repeated:
            if rf.execution_count < repeated.execution_count:
                observations.append(
                    f"RecoverFlow reduced total executions to {rf.execution_count} compared to Repeated Retry ({repeated.execution_count} executions), "
                    f"demonstrating improved execution efficiency."
                )

        if rf and rf.policy_rejection_count > 0:
            observations.append(
                f"Deterministic Policy Engine rejected {rf.policy_rejection_count} unsafe or prohibited recovery attempts."
            )

        if rf and rf.stopped_cases > 0:
            observations.append(
                f"RecoverFlow safely halted recovery on {rf.stopped_cases} cases after exhaustion or explicit policy stopping rules."
            )

        return observations

    def to_dict(self) -> Dict[str, Any]:
        """Returns structured dictionary report."""
        best = self.get_best_strategy()
        return {
            "best_strategy": best,
            "strategies": {
                name: {
                    "total_cases": m.total_cases,
                    "recovered_cases": m.recovered_cases,
                    "failed_cases": m.failed_cases,
                    "recovery_rate": m.recovery_rate,
                    "recovery_rate_pct": f"{m.recovery_rate * 100:.1f}%",
                    "total_failed_revenue": str(m.total_failed_revenue),
                    "total_recovered_revenue": str(m.total_recovered_revenue),
                    "recovery_revenue_percentage": f"{m.recovery_revenue_percentage:.1f}%",
                    "average_attempts_per_case": m.average_attempts_per_case,
                    "execution_count": m.execution_count,
                    "policy_rejection_count": m.policy_rejection_count,
                    "stopped_cases": m.stopped_cases,
                    "escalated_cases": m.escalated_cases,
                }
                for name, m in self.metrics_by_strategy.items()
            },
            "observations": self.generate_observations(),
            "disclaimer": "Synthetic benchmark data and simulated execution. Results are engineering validation evidence, not production performance claims.",
        }

    def to_text(self) -> str:
        """Renders formatted text report table."""
        lines: List[str] = []
        lines.append("==================================================================================")
        lines.append("                    RecoverFlow Comparative Benchmark Report")
        lines.append("==================================================================================")
        lines.append("")
        lines.append(f"{'Strategy':<18} | {'Cases':<6} | {'Recovered':<9} | {'Rate':<7} | {'Revenue Recovered':<18} | {'Executions':<10}")
        lines.append("-" * 82)

        for name, m in self.metrics_by_strategy.items():
            lines.append(
                f"{name:<18} | {m.total_cases:<6} | {m.recovered_cases:<9} | {m.recovery_rate*100:>5.1f}% | "
                f"INR {m.total_recovered_revenue:>14,.2f} | {m.execution_count:<10}"
            )

        lines.append("-" * 82)
        best = self.get_best_strategy()
        lines.append(f"\n[SUMMARY ANALYSIS]")
        lines.append(f"  * Best Performing Strategy: {best}")

        obs = self.generate_observations()
        if obs:
            lines.append("\n[EMPIRICAL OBSERVATIONS]")
            for o in obs:
                lines.append(f"  * {o}")

        lines.append("\n[ENGINEERING DISCLAIMER]")
        lines.append("  These results are derived from deterministic synthetic data and simulated execution.")
        lines.append("  They represent engineering validation evidence, not production performance claims.")
        lines.append("==================================================================================")

        return "\n".join(lines)
