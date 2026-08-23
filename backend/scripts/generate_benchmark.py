import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.data.generator import SyntheticDataGenerator
from app.benchmark.runner import BenchmarkRunner
from app.benchmark.report import BenchmarkReport


def main() -> None:
    seed = 20260822
    customer_count = 100
    payments_per_customer = 10
    failed_ratio = 0.15

    print("=" * 82)
    print("                RecoverFlow Phase 1D Revenue Recovery Benchmark")
    print("=" * 82)

    # 1. Generate Synthetic Dataset
    print("\n[1] Generating Deterministic Synthetic Dataset...")
    generator = SyntheticDataGenerator(
        seed=seed,
        customer_count=customer_count,
        payments_per_customer=payments_per_customer,
        failed_payment_ratio=failed_ratio,
    )
    dataset = generator.generate()

    print(f"  * Seed:                     {dataset.seed}")
    print(f"  * Synthetic Customers:      {len(dataset.customers)}")
    print(f"  * Total Payments Generated: {len(dataset.payments)}")
    print(f"  * Failed Recovery Cases:   {len(dataset.recovery_cases)}")
    print(f"  * Total Revenue at Risk:    INR {dataset.total_failed_amount:,.2f}")

    # 2. Run Benchmark
    print("\n[2] Executing Benchmark Strategies (No Recovery, Blind Retry, Repeated Retry, RecoverFlow)...")
    runner = BenchmarkRunner()
    metrics_by_strategy = runner.run(dataset)

    # 3. Generate Report
    report = BenchmarkReport(metrics_by_strategy)
    print("\n" + report.to_text())


if __name__ == "__main__":
    main()
