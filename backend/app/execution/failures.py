from enum import Enum
from typing import Optional
from dataclasses import dataclass


class ExecutionFailureCategory(str, Enum):
    TRANSIENT_PROVIDER_FAILURE = "TRANSIENT_PROVIDER_FAILURE"
    PERMANENT_PROVIDER_FAILURE = "PERMANENT_PROVIDER_FAILURE"
    VALIDATION_FAILURE = "VALIDATION_FAILURE"
    AUTHORIZATION_FAILURE = "AUTHORIZATION_FAILURE"
    DUPLICATE_EXECUTION = "DUPLICATE_EXECUTION"
    TIMEOUT = "TIMEOUT"
    UNKNOWN = "UNKNOWN"


@dataclass(frozen=True)
class ExecutionFailure:
    """Domain representation of an execution failure with retry classification."""
    category: ExecutionFailureCategory
    code: str
    message: str
    retryable: bool

    @classmethod
    def transient(cls, code: str, message: str) -> "ExecutionFailure":
        return cls(
            category=ExecutionFailureCategory.TRANSIENT_PROVIDER_FAILURE,
            code=code,
            message=message,
            retryable=True,
        )

    @classmethod
    def permanent(cls, code: str, message: str) -> "ExecutionFailure":
        return cls(
            category=ExecutionFailureCategory.PERMANENT_PROVIDER_FAILURE,
            code=code,
            message=message,
            retryable=False,
        )

    @classmethod
    def timeout(cls, message: str = "Provider call timed out.") -> "ExecutionFailure":
        return cls(
            category=ExecutionFailureCategory.TIMEOUT,
            code="EXECUTION_TIMEOUT",
            message=message,
            retryable=True,
        )
