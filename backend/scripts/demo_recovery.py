import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from decimal import Decimal
from app.domain.payment import Payment, FailureCode
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState
from app.recovery.service import RecoveryLoopService
from app.simulation.scenarios import SimulationScenario


def run_demo() -> None:
    print("=" * 60)
    print("      RecoverFlow Autonomous Revenue Recovery System")
    print("        Phase 1C — End-to-End Simulation Demonstration")
    print("=" * 60)

    # 1. Setup Payment, Customer, and RecoveryCase context
    payment = Payment(
        payment_id="pay_demo_888",
        customer_id="cust_demo_999",
        amount=Decimal("4999.00"),
        failure_code=FailureCode.BANK_TIMEOUT,
        failure_reason="Bank gateway timeout during checkout",
        payment_method="UPI",
    )

    customer = CustomerContext(
        customer_id="cust_demo_999",
        historical_success_count=12,
        historical_failure_count=1,
        average_payment_delay_hours=4.0,
        previous_recovery_success_rate=0.92,
        customer_segment="PREMIUM",
        total_spent=Decimal("75000.00"),
    )

    case = RecoveryCase(
        case_id="case_demo_888",
        payment_id=payment.payment_id,
        customer_id=customer.customer_id,
        amount_at_risk=payment.amount,
        state=CaseState.DETECTED,
        attempts_count=0,
        max_allowed_attempts=3,
    )

    print(f"\n[INIT] Failed Payment Ingested:")
    print(f"  • Case ID:       {case.case_id}")
    print(f"  • Payment ID:    {payment.payment_id}")
    print(f"  • Customer ID:   {customer.customer_id} ({customer.customer_segment})")
    print(f"  * Amount:        INR {payment.amount}")
    print(f"  * Failure Code:  {payment.failure_code.value}")
    print(f"  * Reason:        {payment.failure_reason}")

    # 2. Run Autonomous Recovery Service
    service = RecoveryLoopService()
    result = service.run_autonomous_recovery(
        case=case,
        payment=payment,
        customer=customer,
        max_cycles=3,
        simulation_scenario=SimulationScenario.CONTEXT_AWARE,
    )

    # 3. Print Structured Cycle Summary
    print("\n" + "=" * 60)
    print(f"AUTONOMOUS RECOVERY LIFECYCLE SUMMARY ({result.total_cycles} Cycle(s))")
    print("=" * 60)

    for i, cycle in enumerate(result.cycles, 1):
        print(f"\n--- Cycle {i} ---")
        if cycle.opportunity:
            print(f"  1. Intelligence Opportunity:")
            print(f"     * Recoverability Level: {cycle.opportunity.recoverability_level.value}")
            print(f"     * Recoverability Score: {cycle.opportunity.recoverability_score:.1f}/100")
            print(f"     * Actionability:        {cycle.opportunity.actionability.value}")
            print(f"     * Primary Reason:       {cycle.opportunity.primary_reason}")

        if cycle.agent_decision:
            print(f"  2. AI Reasoning Layer:")
            print(f"     * Decision ID:          {cycle.agent_decision.decision_id}")
            print(f"     * Recommended Action:   {cycle.agent_decision.recommended_action.action_type.value}")
            print(f"     * Confidence:           {cycle.agent_decision.confidence * 100:.1f}%")
            print(f"     * Rationale:            {cycle.agent_decision.rationale}")

        if cycle.policy_decision:
            print(f"  3. Deterministic Safety Engine:")
            print(f"     * Policy Decision ID:   {cycle.policy_decision.policy_decision_id}")
            print(f"     * Execution Allowed:    {cycle.policy_decision.allowed}")
            print(f"     * Rules Evaluated:      {', '.join(cycle.policy_decision.rules_evaluated)}")

        if cycle.execution:
            print(f"  4. Execution Authority Gatekeeper:")
            print(f"     * Execution ID:         {cycle.execution.execution_id}")
            print(f"     * Idempotency Key:      {cycle.execution.idempotency_key}")
            print(f"     * Status:               {cycle.execution.status.value}")

        if cycle.outcome:
            print(f"  5. Simulated Execution & Verification:")
            print(f"     * Outcome Status:       {cycle.outcome.status.value}")
            print(f"     * Amount Recovered:     INR {cycle.outcome.recovered_amount}")
            print(f"     * Provider Ref:         {cycle.execution.provider_reference}")

    print("\n" + "=" * 60)
    print("FINAL SYSTEM STATUS & EVALUATION")
    print("=" * 60)
    print(f"  * Overall Recovered:    {result.is_recovered}")
    print(f"  * Final Case State:     {result.final_case.state.value}")
    print(f"  * Total Amount Recovered: INR {result.overall_evaluation.amount_recovered}")
    print(f"  * Stop Reason:          {result.stop_reason}")
    print(f"  * Total Audit Logged:   {len(result.audit_events)} Event(s)")


    print("\n[AUDIT LOG EVENTS]")
    for event in result.audit_events:
        print(f"  [{event.timestamp.strftime('%H:%M:%S')}] {event.event_type.value:<22} | Actor: {event.actor:<20} | Details: {event.details}")

    print("\n" + "=" * 60)
    print("Demonstration completed successfully. AI has ZERO direct financial execution authority.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run_demo()
