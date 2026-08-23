import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.jobs.reconciliation import JobQueueReconciliationService, QueueReconciliationReport
from app.workers.worker_registry import WorkerRegistry
from app.observability.telemetry import telemetry_registry

logger = logging.getLogger("recoverflow.jobs.maintenance")


@dataclass
class MaintenanceReport:
    stale_workers_detected: int = 0
    leases_recovered: int = 0
    reconciliation_report: Optional[QueueReconciliationReport] = None
    executed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stale_workers_detected": self.stale_workers_detected,
            "leases_recovered": self.leases_recovered,
            "reconciliation": self.reconciliation_report.to_dict() if self.reconciliation_report else None,
            "executed_at": self.executed_at.isoformat(),
        }


class MaintenanceService:
    """Deterministic, idempotent maintenance execution service for bounded background housekeeping."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def run_once(self) -> MaintenanceReport:
        """Executes a single bounded maintenance pass."""
        logger.info("Executing maintenance pass...")
        registry = WorkerRegistry(self.session)
        stale_workers = registry.detect_stale_workers(timeout_seconds=30.0)

        recon_service = JobQueueReconciliationService(self.session)
        recon_report = recon_service.reconcile_queue()

        report = MaintenanceReport(
            stale_workers_detected=len(stale_workers),
            leases_recovered=recon_report.repaired,
            reconciliation_report=recon_report,
            executed_at=datetime.now(timezone.utc),
        )

        telemetry_registry.increment("maintenance.executed")
        logger.info("Maintenance pass complete: %s", report.to_dict())
        return report
