from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import uuid
from sqlalchemy.orm import Session

from app.domain.audit import AuditEventType
from app.repository.postgres import PostgresRecoveryJobRepository, PostgresAuditRepository
from app.repository.models import RecoveryJobModel, AuditEventModel


class InvalidJobStateOperationError(Exception):
    """Raised when an illegal operation is requested on a recovery job."""
    pass


class RecoveryJobOperationsService:
    """Operations service managing recovery jobs."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.job_repo = PostgresRecoveryJobRepository(session)
        self.audit_repo = PostgresAuditRepository(session)

    def list_jobs_by_status(self, status: Optional[str] = None, limit: int = 50) -> List[RecoveryJobModel]:
        query = self.session.query(RecoveryJobModel)
        if status:
            query = query.filter(RecoveryJobModel.status == status.upper())
        return query.order_by(RecoveryJobModel.created_at.desc()).limit(limit).all()

    def retry_job(self, job_id: str, actor: str = "OPERATOR") -> RecoveryJobModel:
        job = self.job_repo.get_by_id(job_id)
        if not job:
            raise InvalidJobStateOperationError(f"Recovery job {job_id} not found.")

        if job.status in ("COMPLETED", "CANCELLED"):
            raise InvalidJobStateOperationError(f"Cannot retry job in terminal status '{job.status}'.")

        if job.attempt_number >= job.max_attempts and job.status != "DEAD_LETTERED":
            raise InvalidJobStateOperationError(
                f"Job {job_id} has reached maximum allowed attempts ({job.attempt_number}/{job.max_attempts})."
            )

        job.status = "RETRY_SCHEDULED"
        job.available_at = datetime.utcnow()
        job.updated_at = datetime.utcnow()
        self.job_repo.save(job)

        corr_id = job.correlation_id or f"corr_job_{uuid.uuid4().hex[:8]}"
        audit_entry = AuditEventModel(
            id=f"aud_job_{uuid.uuid4().hex[:12]}",
            event_type=AuditEventType.JOB_RETRY_SCHEDULED.value,
            aggregate_id=job.job_id,
            case_id=job.case_id,
            payload=json.dumps({"job_id": job.job_id, "action": "RETRY_REQUESTED", "actor": actor}),
            timestamp=datetime.utcnow(),
            correlation_id=corr_id,
        )
        self.audit_repo.save_event(audit_entry)
        self.session.commit()
        return job

    def cancel_job(self, job_id: str, reason: str = "Operator cancelled job.", actor: str = "OPERATOR") -> RecoveryJobModel:
        job = self.job_repo.get_by_id(job_id)
        if not job:
            raise InvalidJobStateOperationError(f"Recovery job {job_id} not found.")

        if job.status == "COMPLETED":
            raise InvalidJobStateOperationError(f"Cannot cancel completed job {job_id}.")

        job.status = "CANCELLED"
        job.last_error = f"Cancelled by {actor}: {reason}"
        job.updated_at = datetime.utcnow()
        self.job_repo.save(job)

        corr_id = job.correlation_id or f"corr_job_{uuid.uuid4().hex[:8]}"
        audit_entry = AuditEventModel(
            id=f"aud_job_{uuid.uuid4().hex[:12]}",
            event_type=AuditEventType.JOB_DEAD_LETTERED.value if False else "JOB_CANCELLED",
            aggregate_id=job.job_id,
            case_id=job.case_id,
            payload=json.dumps({"job_id": job.job_id, "action": "CANCELLED", "reason": reason, "actor": actor}),
            timestamp=datetime.utcnow(),
            correlation_id=corr_id,
        )
        self.audit_repo.save_event(audit_entry)
        self.session.commit()
        return job

    def requeue_dead_letter(self, job_id: str, actor: str = "OPERATOR") -> RecoveryJobModel:
        job = self.job_repo.get_by_id(job_id)
        if not job:
            raise InvalidJobStateOperationError(f"Recovery job {job_id} not found.")

        if job.status != "DEAD_LETTERED" and job.status != "FAILED":
            raise InvalidJobStateOperationError(f"Job {job_id} is in status '{job.status}', not eligible for dead-letter requeue.")

        job.status = "QUEUED"
        job.available_at = datetime.utcnow()
        job.updated_at = datetime.utcnow()
        self.job_repo.save(job)

        corr_id = job.correlation_id or f"corr_job_{uuid.uuid4().hex[:8]}"
        audit_entry = AuditEventModel(
            id=f"aud_job_{uuid.uuid4().hex[:12]}",
            event_type="JOB_REQUEUED",
            aggregate_id=job.job_id,
            case_id=job.case_id,
            payload=json.dumps({"job_id": job.job_id, "action": "REQUEUED", "actor": actor}),
            timestamp=datetime.utcnow(),
            correlation_id=corr_id,
        )
        self.audit_repo.save_event(audit_entry)
        self.session.commit()
        return job

    def recover_expired_jobs(self, actor: str = "OPERATOR") -> List[RecoveryJobModel]:
        recovered = self.job_repo.recover_expired_jobs()
        models = []
        for job in recovered:
            m = self.job_repo.get_job(job.job_id)
            if m:
                models.append(m)
        return models
