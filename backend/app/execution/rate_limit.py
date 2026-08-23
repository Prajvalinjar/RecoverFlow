import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone

from app.execution.errors import ProviderErrorCategory, classify_provider_error, NormalizedProviderError
from app.execution.provider_health import ProviderHealthMonitor, ProviderHealthStatus
from app.execution.circuit_breaker import CircuitBreaker, ProviderCircuitOpenError
from app.observability.telemetry import telemetry_registry
from app.domain.audit import AuditTrail, AuditEventType

logger = logging.getLogger("recoverflow.execution.rate_limit")


class ProviderRateLimitHandler:
    """Integrates provider rate-limit signals with telemetry, audit trail, circuit breaker, and health monitor."""

    def __init__(
        self,
        health_monitor: Optional[ProviderHealthMonitor] = None,
        circuit_breaker: Optional[CircuitBreaker] = None,
    ) -> None:
        self.health_monitor = health_monitor or ProviderHealthMonitor()
        self.circuit_breaker = circuit_breaker or CircuitBreaker()

    def handle_rate_limit(
        self,
        provider_name: str,
        execution_id: str,
        correlation_id: Optional[str] = None,
        retry_after_seconds: float = 60.0,
        audit_trail: Optional[AuditTrail] = None,
    ) -> NormalizedProviderError:
        """Processes a rate limit event deterministically."""
        logger.warning(
            "Provider '%s' rate limit encountered for execution '%s'. Retry after: %.1fs",
            provider_name,
            execution_id,
            retry_after_seconds,
        )

        # 1. Telemetry signal
        telemetry_registry.increment("provider.execution.rate_limited")
        telemetry_registry.increment(f"provider.{provider_name.lower()}.rate_limited")

        # 2. Record failure signal in health monitor
        self.health_monitor.record_failure(
            provider_name=provider_name,
            error_message=f"Rate limit exceeded (HTTP 429). Retry after {retry_after_seconds}s.",
        )

        # 3. Record failure in circuit breaker
        self.circuit_breaker.record_failure()

        # 4. Audit Trail recording if provided
        if audit_trail:
            audit_trail.record(
                case_id="",
                event_type=AuditEventType.PROVIDER_RATE_LIMITED,
                actor="ProviderRateLimitHandler",
                details={
                    "provider": provider_name,
                    "execution_id": execution_id,
                    "retry_after_seconds": retry_after_seconds,
                    "status": "RATE_LIMITED",
                },
                correlation_id=correlation_id,
            )

        return NormalizedProviderError(
            category=ProviderErrorCategory.RATE_LIMITED,
            code="RATE_LIMIT_EXCEEDED",
            message=f"Provider '{provider_name}' rate limit exceeded. Retry after {retry_after_seconds}s.",
            retryable=True,
            provider=provider_name,
            http_code=429,
            correlation_id=correlation_id,
        )


provider_rate_limit_handler = ProviderRateLimitHandler()
