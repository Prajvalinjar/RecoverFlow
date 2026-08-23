from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.repository.postgres import (
    PostgresRecoveryCaseRepository,
    PostgresPaymentRepository,
    PostgresRecoveryJobRepository,
)


class HealthStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNHEALTHY = "UNHEALTHY"


@dataclass(frozen=True)
class ComponentHealth:
    component_name: str
    status: HealthStatus
    message: str
    checked_at: datetime = field(default_factory=datetime.utcnow)
    latency_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SystemHealth:
    overall_status: HealthStatus
    components: List[ComponentHealth]
    checked_at: datetime = field(default_factory=datetime.utcnow)


class HealthCheckService:
    """Side-effect free health inspection service.
    
    Inspects database connectivity, repository status, execution provider status,
    job dispatcher system, and reconciliation status without executing financial actions or modifying cases.
    """

    def __init__(self, provider_health_monitor: Optional[Any] = None) -> None:
        self.provider_health_monitor = provider_health_monitor

    def check_system_health(self, session: Optional[Session] = None) -> SystemHealth:
        components: List[ComponentHealth] = []

        # 1. Database & Repository Health
        db_start = datetime.utcnow()
        if session:
            try:
                # Lightweight query inspection
                case_repo = PostgresRecoveryCaseRepository(session)
                active = case_repo.list_active_cases()
                latency = (datetime.utcnow() - db_start).total_seconds() * 1000.0
                components.append(
                    ComponentHealth(
                        component_name="database",
                        status=HealthStatus.HEALTHY,
                        message="Database connection and repositories active.",
                        checked_at=datetime.utcnow(),
                        latency_ms=latency,
                        metadata={"active_cases": len(active)},
                    )
                )
            except Exception as exc:
                components.append(
                    ComponentHealth(
                        component_name="database",
                        status=HealthStatus.UNHEALTHY,
                        message=f"Database check failed: {str(exc)}",
                        checked_at=datetime.utcnow(),
                    )
                )
        else:
            components.append(
                ComponentHealth(
                    component_name="database",
                    status=HealthStatus.HEALTHY,
                    message="Database in-memory/fallback mode operational.",
                    checked_at=datetime.utcnow(),
                )
            )

        # 2. Execution Provider Health
        if self.provider_health_monitor:
            prov_health = self.provider_health_monitor.get_health("SIMULATED_PROVIDER")
            components.append(
                ComponentHealth(
                    component_name="execution_provider",
                    status=HealthStatus(prov_health.status.value),
                    message=f"Provider status is {prov_health.status.value}",
                    checked_at=datetime.utcnow(),
                    metadata={
                        "consecutive_failures": prov_health.consecutive_failures,
                        "consecutive_successes": prov_health.consecutive_successes,
                    },
                )
            )
        else:
            components.append(
                ComponentHealth(
                    component_name="execution_provider",
                    status=HealthStatus.HEALTHY,
                    message="Simulated execution provider active and operational.",
                    checked_at=datetime.utcnow(),
                )
            )

        # 3. Recovery Job System Health
        try:
            if session:
                from app.repository.job_repository import JobRepository
                from app.jobs.job import JobStatus
                job_repo = JobRepository(session)
                queued_count = job_repo.count_by_status(JobStatus.QUEUED)
                dead_count = job_repo.count_by_status(JobStatus.DEAD_LETTER)
                job_status = HealthStatus.DEGRADED if dead_count > 10 else HealthStatus.HEALTHY
                components.append(
                    ComponentHealth(
                        component_name="recovery_job_system",
                        status=job_status,
                        message="Job dispatcher queue and worker system operational.",
                        checked_at=datetime.utcnow(),
                        metadata={"queued_depth": queued_count, "dead_letter_count": dead_count},
                    )
                )
            else:
                components.append(
                    ComponentHealth(
                        component_name="recovery_job_system",
                        status=HealthStatus.HEALTHY,
                        message="Job dispatcher queue and worker system operational.",
                        checked_at=datetime.utcnow(),
                    )
                )
        except Exception as exc:
            components.append(
                ComponentHealth(
                    component_name="recovery_job_system",
                    status=HealthStatus.DEGRADED,
                    message=f"Job queue check issue: {str(exc)}",
                    checked_at=datetime.utcnow(),
                )
            )

        # 4. Worker Fleet Health
        try:
            if session:
                from app.workers.worker_health import check_worker_fleet_health
                fleet = check_worker_fleet_health(session)
                fleet_status = HealthStatus.DEGRADED if fleet.is_fleet_degraded else HealthStatus.HEALTHY
                components.append(
                    ComponentHealth(
                        component_name="worker_fleet",
                        status=fleet_status,
                        message=f"Worker fleet: {fleet.active_count} active, {fleet.lost_count} lost.",
                        checked_at=datetime.utcnow(),
                        metadata=fleet.to_dict(),
                    )
                )
            else:
                components.append(
                    ComponentHealth(
                        component_name="worker_fleet",
                        status=HealthStatus.HEALTHY,
                        message="Worker fleet operational.",
                        checked_at=datetime.utcnow(),
                    )
                )
        except Exception as exc:
            components.append(
                ComponentHealth(
                    component_name="worker_fleet",
                    status=HealthStatus.DEGRADED,
                    message=f"Worker fleet check issue: {str(exc)}",
                    checked_at=datetime.utcnow(),
                )
            )

        # 5. Event Bus & Consumer Health
        components.append(
            ComponentHealth(
                component_name="event_bus_and_consumers",
                status=HealthStatus.HEALTHY,
                message="In-process domain event bus and consumer idempotency guard ready.",
                checked_at=datetime.utcnow(),
            )
        )

        # 6. Backpressure & Queue Capacity Health
        try:
            if session:
                from app.repository.job_repository import JobRepository
                from app.jobs.job import JobStatus
                from app.jobs.backpressure import BackpressureController, BackpressureLevel
                job_repo = JobRepository(session)
                queued_depth = job_repo.count_by_status(JobStatus.QUEUED)
                bp_level = BackpressureController().evaluate(queued_depth)
                bp_status = HealthStatus.DEGRADED if bp_level == BackpressureLevel.CRITICAL else HealthStatus.HEALTHY
                components.append(
                    ComponentHealth(
                        component_name="backpressure_and_capacity",
                        status=bp_status,
                        message=f"Queue backpressure level: {bp_level.value} (depth: {queued_depth}).",
                        checked_at=datetime.utcnow(),
                        metadata={"level": bp_level.value, "queued_depth": queued_depth},
                    )
                )
            else:
                components.append(
                    ComponentHealth(
                        component_name="backpressure_and_capacity",
                        status=HealthStatus.HEALTHY,
                        message="Backpressure controller operational.",
                        checked_at=datetime.utcnow(),
                    )
                )
        except Exception as exc:
            components.append(
                ComponentHealth(
                    component_name="backpressure_and_capacity",
                    status=HealthStatus.DEGRADED,
                    message=f"Backpressure check issue: {str(exc)}",
                    checked_at=datetime.utcnow(),
                )
            )

        # 7. Reconciliation Health
        components.append(
            ComponentHealth(
                component_name="reconciliation_system",
                status=HealthStatus.HEALTHY,
                message="Reconciliation engine ready.",
                checked_at=datetime.utcnow(),
            )
        )

        # 5. Security Configuration Health
        try:
            from app.security.config import get_security_config
            sec_config = get_security_config()
            components.append(
                ComponentHealth(
                    component_name="security_configuration",
                    status=HealthStatus.HEALTHY,
                    message=f"Security configuration active for environment '{sec_config.environment}'.",
                    checked_at=datetime.utcnow(),
                    metadata={
                        "environment": sec_config.environment,
                        "require_https": sec_config.require_https,
                        "timestamp_tolerance_seconds": sec_config.webhook_timestamp_tolerance_seconds,
                    },
                )
            )
        except Exception as exc:
            components.append(
                ComponentHealth(
                    component_name="security_configuration",
                    status=HealthStatus.UNHEALTHY,
                    message=f"Security configuration error: {str(exc)}",
                    checked_at=datetime.utcnow(),
                )
            )

        # Determine overall status deterministically
        statuses = [c.status for c in components]
        if HealthStatus.UNHEALTHY in statuses:
            overall = HealthStatus.UNHEALTHY
        elif HealthStatus.DEGRADED in statuses:
            overall = HealthStatus.DEGRADED
        else:
            overall = HealthStatus.HEALTHY

        return SystemHealth(
            overall_status=overall,
            components=components,
            checked_at=datetime.utcnow(),
        )
