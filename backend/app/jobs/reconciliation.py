import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.jobs.job import JobStatus
from app.repository.job_repository import JobRepository
from app.workers.worker_registry import WorkerRegistry
from app.repository.models import RecoveryCaseModel, RecoveryJobModel
from app.observability.telemetry import telemetry_registry

logger = logging.getLogger("recoverflow.jobs.reconciliation")


@dataclass
class QueueReconciliationReport:
    scanned: int = 0
    repaired: int = 0
    skipped: int = 0
    failed: int = 0
    manual_review: int = 0
    issues: List[Dict[str, Any]] = field(default_factory=list)
    reconciled_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scanned": self.scanned,
            "repaired": self.repaired,
            "skipped": self.skipped,
            "failed": self.failed,
            "manual_review": self.manual_review,
            "issue_count": len(self.issues),
            "issues": self.issues,
            "reconciled_at": self.reconciled_at.isoformat(),
        }


class JobQueueReconciliationService:
    """Production queue reconciliation engine checking queue integrity and repairing inconsistent job states."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def reconcile_queue(self) -> QueueReconciliationReport:
        report = QueueReconciliationReport()
        repo = JobRepository(self.session)
        registry = WorkerRegistry(self.session)

        # 1. Sweep expired worker leases
        recovered = repo.recover_expired_jobs()
        report.scanned += len(recovered)
        report.repaired += len(recovered)

        # 2. Sweep jobs owned by lost workers
        lost_workers = registry.detect_stale_workers(timeout_seconds=30.0)
        for lost_w in lost_workers:
            lost_reclaimed = repo.recover_jobs_owned_by_worker(lost_w.worker_id)
            report.scanned += len(lost_reclaimed)
            report.repaired += len(lost_reclaimed)

        # 3. Check CLAIMED or RUNNING jobs referencing terminal cases
        active_jobs = self.session.query(RecoveryJobModel).filter(
            RecoveryJobModel.status.in_([JobStatus.CLAIMED.value, JobStatus.RUNNING.value, JobStatus.QUEUED.value])
        ).all()

        for j in active_jobs:
            report.scanned += 1
            case = self.session.query(RecoveryCaseModel).filter(RecoveryCaseModel.id == j.case_id).first()
            if case and case.state in ("RECOVERED", "STOPPED", "ESCALATED"):
                j.status = JobStatus.CANCELLED.value
                j.last_error = f"Terminal case state: {case.state}"
                j.updated_at = datetime.now(timezone.utc)
                self.session.merge(j)
                report.repaired += 1
                report.issues.append({"job_id": j.job_id, "issue": "Terminal case reference", "repaired_to": "CANCELLED"})

        if report.repaired > 0:
            self.session.commit()

        telemetry_registry.increment_counter("queue.reconciliation_scanned", float(report.scanned))
        telemetry_registry.increment_counter("queue.reconciliation_repaired", float(report.repaired))
        return report
