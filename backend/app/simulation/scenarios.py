from enum import Enum
from typing import Optional
from decimal import Decimal
from dataclasses import dataclass


class SimulationScenario(str, Enum):
    """Supported deterministic simulation scenario modes."""
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    PARTIAL_RECOVERY = "PARTIAL_RECOVERY"
    PENDING = "PENDING"
    CONTEXT_AWARE = "CONTEXT_AWARE"


@dataclass(frozen=True)
class SimulationConfig:
    """Strongly typed deterministic configuration object for recovery execution simulation.
    
    Zero random number generation or wall-clock randomness.
    Given the same inputs and config, identical deterministic outcomes are produced.
    """
    scenario: SimulationScenario = SimulationScenario.CONTEXT_AWARE
    force_status: Optional[str] = None
    force_recovered_amount: Optional[Decimal] = None
    force_failure_reason: Optional[str] = None
