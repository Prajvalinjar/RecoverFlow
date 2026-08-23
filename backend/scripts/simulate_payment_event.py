import sys
import os
import argparse
from decimal import Decimal
from datetime import datetime
import json

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import engine, Base
from app.database.session import SessionLocal
from app.api.schemas.events import PaymentFailureEvent
from app.events.processor import PaymentEventProcessor
from app.repository.postgres import (
    PostgresRecoveryCaseRepository,
    PostgresAuditRepository,
    PostgresRecoveryExecutionRepository,
    PostgresRecoveryJobRepository,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="RecoverFlow Production Payment Event Simulation CLI")
    parser.add_argument("--payment-id", default="pay_sim_001", help="Payment ID")
    parser.add_argument("--customer-id", default="cust_sim_001", help="Customer ID")
    parser.add_argument("--amount", type=float, default=4999.00, help="Payment Amount")
    parser.add_argument("--failure-code", default="BANK_TIMEOUT", help="Failure Code")
    parser.add_argument("--event-id", default=None, help="Provider Event ID")

    args = parser.parse_args()

    event_id = args.event_id or f"evt_sim_{args.payment_id}"
    amount_dec = Decimal(str(args.amount))

    print("=" * 82)
    print("        RecoverFlow Production Payment Event Ingestion Simulation")
    print("=" * 82)
    print(f"\n[EVENT INPUT]")
    print(f"  * Event ID:     {event_id}")
    print(f"  * Payment ID:   {args.payment_id}")
    print(f"  * Customer ID:  {args.customer_id}")
    print(f"  * Amount:       INR {amount_dec:,.2f}")
    print(f"  * Failure Code: {args.failure_code}")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Ingest event using production PaymentEventProcessor and database session
    db = SessionLocal()
    try:
        event = PaymentFailureEvent(
            event_id=event_id,
            event_type="payment.failed",
            payment_id=args.payment_id,
            customer_id=args.customer_id,
            amount=amount_dec,
            currency="INR",
            failure_code=args.failure_code,
            occurred_at=datetime.utcnow(),
        )

        processor = PaymentEventProcessor(db)
        print("\n[INGESTING EVENT VIA PRODUCTION PROCESSOR...]")
        res = processor.process_event(event, trigger_recovery=True)

        print("\n[INGESTION RESULT]")
        print(f"  * Status:            {res.status.upper()}")
        print(f"  * Provider Event ID: {res.provider_event_id}")
        print(f"  * Case ID:           {res.case_id}")
        print(f"  * Duplicate Event:   {res.duplicate}")
        print(f"  * Message:           {res.message}")

        if res.case_id:
            case_repo = PostgresRecoveryCaseRepository(db)
            audit_repo = PostgresAuditRepository(db)
            execution_repo = PostgresRecoveryExecutionRepository(db)
            job_repo = PostgresRecoveryJobRepository(db)

            case = case_repo.get_by_id(res.case_id)
            print("\n[PERSISTENT CASE STATUS]")
            print(f"  * Case ID:       {case.id if case else 'N/A'}")
            print(f"  * Case State:    {case.state if case else 'N/A'}")
            print(f"  * Attempts:      {case.attempt_count if case else 'N/A'}")

            jobs = job_repo.list_for_case(res.case_id)
            if jobs:
                print(f"\n[RECOVERY JOBS ({len(jobs)})]")
                for job in jobs:
                    print(f"  * Job ID: {job.job_id} | Status: {job.status} | Attempts: {job.attempt_number}/{job.max_attempts}")

            executions = execution_repo.list_for_case(res.case_id)
            if executions:
                print(f"\n[PERSISTENT EXECUTIONS ({len(executions)})]")
                for ex in executions:
                    print(f"  * Exec ID: {ex.execution_id} | Action: {ex.action_type} | Status: {ex.status} | Provider: {ex.provider}")

            timeline = audit_repo.get_timeline_for_case(res.case_id)
            print(f"\n[LIFECYCLE TIMELINE ({len(timeline)} Events)]")
            for idx, entry in enumerate(timeline, start=1):
                try:
                    payload = json.loads(entry.payload)
                except Exception:
                    payload = entry.payload
                corr = f" | Corr: {entry.correlation_id}" if entry.correlation_id else ""
                print(f"  {idx}. [{entry.timestamp.strftime('%H:%M:%S')}] {entry.event_type:<24}{corr} | Details: {payload}")

    finally:
        db.close()

    print("\n=" * 82)


if __name__ == "__main__":
    main()
