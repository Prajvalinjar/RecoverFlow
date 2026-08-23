from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Optional, List
from dataclasses import dataclass, field
from datetime import datetime

from app.domain.payment import Payment, FailureCode
from app.domain.customer import CustomerContext
from app.domain.recovery_case import RecoveryCase, CaseState
from app.domain.actions import CandidateRecoveryAction, ActionType
from app.domain.policy import PolicyDecision
from app.domain.execution import RecoveryExecution, ExecutionStatus
from app.domain.orchestrator import RecoveryOrchestrator
from app.domain.outcome import RecoveryOutcome, OutcomeStatus

from app.data.models import SyntheticCustomer, SyntheticPayment, SyntheticRecoveryCase
from app.simulation.executor import SimulatedRecoveryExecutor
from app.simulation.scenarios import SimulationScenario
from app.recovery.service import RecoveryLoopService, AutonomousRecoveryResult


@dataclass
class StrategyCaseResult:
    """Result of running a specific baseline strategy against a single recovery case."""
    strategy_name: str
    case_id: str
    is_recovered: bool
    amount_recovered: Decimal
    attempts_count: int
    execution_count: int
    policy_rejection_count: int
    final_case_state: str
    is_stopped: bool
    is_escalated: bool


class BaselineStrategy(ABC):
    """Abstract interface defining a recovery benchmark strategy execution contract."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def run_case(
        self,
        customer: SyntheticCustomer,
        payment: SyntheticPayment,
        case: SyntheticRecoveryCase,
        executor: Optional[SimulatedRecoveryExecutor] = None,
    ) -> StrategyCaseResult:
        pass


class NoRecoveryBaseline(BaselineStrategy):
    """Baseline 1: No Recovery. Never attempts recovery interventions."""

    @property
    def name(self) -> str:
        return "No Recovery"

    def run_case(
        self,
        customer: SyntheticCustomer,
        payment: SyntheticPayment,
        case: SyntheticRecoveryCase,
        executor: Optional[SimulatedRecoveryExecutor] = None,
    ) -> StrategyCaseResult:
        return StrategyCaseResult(
            strategy_name=self.name,
            case_id=case.case_id,
            is_recovered=False,
            amount_recovered=Decimal("0.00"),
            attempts_count=0,
            execution_count=0,
            policy_rejection_count=0,
            final_case_state=case.state.value if hasattr(case.state, "value") else str(case.state),
            is_stopped=False,
            is_escalated=False,
        )


class BlindRetryBaseline(BaselineStrategy):
    """Baseline 2: Blind Retry. Attempts exactly one immediate retry without context, policy checks, or adaptation."""

    @property
    def name(self) -> str:
        return "Blind Retry"

    def run_case(
        self,
        customer: SyntheticCustomer,
        payment: SyntheticPayment,
        case: SyntheticRecoveryCase,
        executor: Optional[SimulatedRecoveryExecutor] = None,
    ) -> StrategyCaseResult:
        sim_executor = executor or SimulatedRecoveryExecutor()
        domain_payment = payment.to_domain_payment()
        domain_case = case.to_domain_recovery_case()

        if domain_case.is_terminal():
            return StrategyCaseResult(
                strategy_name=self.name,
                case_id=case.case_id,
                is_recovered=domain_case.state == CaseState.RECOVERED,
                amount_recovered=payment.amount if domain_case.state == CaseState.RECOVERED else Decimal("0.00"),
                attempts_count=domain_case.attempts_count,
                execution_count=0,
                policy_rejection_count=0,
                final_case_state=domain_case.state.value,
                is_stopped=domain_case.state == CaseState.STOPPED,
                is_escalated=domain_case.state == CaseState.ESCALATED,
            )

        orchestrator = RecoveryOrchestrator()
        action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE)
        approved_policy = PolicyDecision(
            policy_decision_id=f"pol_blind_{case.case_id}",
            case_id=case.case_id,
            decision_id=f"dec_blind_{case.case_id}",
            action=action,
            allowed=True,
        )

        execution = orchestrator.dispatch(approved_policy, domain_case)
        outcome = sim_executor.execute(execution, domain_payment, SimulationScenario.CONTEXT_AWARE)

        is_recovered = outcome.status == OutcomeStatus.RECOVERED
        recovered_amount = outcome.recovered_amount if is_recovered else Decimal("0.00")
        final_state = CaseState.RECOVERED.value if is_recovered else CaseState.FAILED.value

        return StrategyCaseResult(
            strategy_name=self.name,
            case_id=case.case_id,
            is_recovered=is_recovered,
            amount_recovered=recovered_amount,
            attempts_count=1,
            execution_count=1,
            policy_rejection_count=0,
            final_case_state=final_state,
            is_stopped=False,
            is_escalated=False,
        )


class RepeatedRetryBaseline(BaselineStrategy):
    """Baseline 3: Repeated Retry. Attempts up to 3 retries repeatedly regardless of context or previous failure."""

    @property
    def name(self) -> str:
        return "Repeated Retry"

    def run_case(
        self,
        customer: SyntheticCustomer,
        payment: SyntheticPayment,
        case: SyntheticRecoveryCase,
        executor: Optional[SimulatedRecoveryExecutor] = None,
    ) -> StrategyCaseResult:
        sim_executor = executor or SimulatedRecoveryExecutor()
        domain_payment = payment.to_domain_payment()
        domain_case = case.to_domain_recovery_case()

        if domain_case.is_terminal():
            return StrategyCaseResult(
                strategy_name=self.name,
                case_id=case.case_id,
                is_recovered=domain_case.state == CaseState.RECOVERED,
                amount_recovered=payment.amount if domain_case.state == CaseState.RECOVERED else Decimal("0.00"),
                attempts_count=domain_case.attempts_count,
                execution_count=0,
                policy_rejection_count=0,
                final_case_state=domain_case.state.value,
                is_stopped=domain_case.state == CaseState.STOPPED,
                is_escalated=domain_case.state == CaseState.ESCALATED,
            )

        orchestrator = RecoveryOrchestrator()
        execution_count = 0
        is_recovered = False
        recovered_amount = Decimal("0.00")

        while domain_case.attempts_count < domain_case.max_allowed_attempts and not is_recovered:
            action = CandidateRecoveryAction(action_type=ActionType.RETRY_IMMEDIATE)
            approved_policy = PolicyDecision(
                policy_decision_id=f"pol_rep_{case.case_id}_{domain_case.attempts_count+1}",
                case_id=case.case_id,
                decision_id=f"dec_rep_{case.case_id}_{domain_case.attempts_count+1}",
                action=action,
                allowed=True,
            )

            execution = orchestrator.dispatch(approved_policy, domain_case)
            execution_count += 1
            outcome = sim_executor.execute(execution, domain_payment, SimulationScenario.CONTEXT_AWARE)

            if outcome.status == OutcomeStatus.RECOVERED:
                is_recovered = True
                recovered_amount = outcome.recovered_amount
                domain_case.state = CaseState.RECOVERED
                break
            else:
                domain_case.state = CaseState.FAILED

        if not is_recovered and domain_case.attempts_count >= domain_case.max_allowed_attempts:
            domain_case.state = CaseState.STOPPED

        return StrategyCaseResult(
            strategy_name=self.name,
            case_id=case.case_id,
            is_recovered=is_recovered,
            amount_recovered=recovered_amount,
            attempts_count=domain_case.attempts_count,
            execution_count=execution_count,
            policy_rejection_count=0,
            final_case_state=domain_case.state.value,
            is_stopped=domain_case.state == CaseState.STOPPED,
            is_escalated=domain_case.state == CaseState.ESCALATED,
        )


class RecoverFlowStrategy(BaselineStrategy):
    """RecoverFlow Benchmark Strategy. Executes the REAL Phase 1C RecoveryLoopService pipeline."""

    def __init__(self, service: Optional[RecoveryLoopService] = None) -> None:
        self.service = service or RecoveryLoopService()

    @property
    def name(self) -> str:
        return "RecoverFlow"

    def run_case(
        self,
        customer: SyntheticCustomer,
        payment: SyntheticPayment,
        case: SyntheticRecoveryCase,
        executor: Optional[SimulatedRecoveryExecutor] = None,
    ) -> StrategyCaseResult:
        # Convert synthetic models to real Phase 1A domain models
        domain_customer = customer.to_domain_customer_context()
        domain_payment = payment.to_domain_payment()
        domain_case = case.to_domain_recovery_case()

        # If custom executor provided, inject into service executor
        service = self.service
        if executor is not None:
            service.executor = executor

        # Execute full autonomous recovery pipeline
        res: AutonomousRecoveryResult = service.run_autonomous_recovery(
            case=domain_case,
            payment=domain_payment,
            customer=domain_customer,
            max_cycles=3,
            simulation_scenario=SimulationScenario.CONTEXT_AWARE,
        )

        exec_count = sum(1 for c in res.cycles if c.action_executed and c.execution)
        rej_count = sum(1 for c in res.cycles if c.policy_decision and not c.policy_decision.allowed)

        return StrategyCaseResult(
            strategy_name=self.name,
            case_id=case.case_id,
            is_recovered=res.is_recovered,
            amount_recovered=res.overall_evaluation.amount_recovered,
            attempts_count=res.final_case.attempts_count,
            execution_count=exec_count,
            policy_rejection_count=rej_count,
            final_case_state=res.final_case.state.value,
            is_stopped=res.final_case.state == CaseState.STOPPED,
            is_escalated=res.final_case.state == CaseState.ESCALATED,
        )
