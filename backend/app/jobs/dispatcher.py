from typing import Optional
from datetime import datetime, timezone
import json
import uuid
from sqlalchemy.orm import Session

from app.jobs.job import RecoveryJob, JobStatus, JobType
from app.repository.job_repository import JobRepository
from app.domain.audit import AuditEvent, AuditEventType
from app.repository.postgres import PostgresAuditRepository
from app.repository.models import AuditEventModel
from app.observability.telemetry import telemetry_registry


class RecoveryJobDispatcher:
    """Upgraded background-safe recovery job dispatcher.

    Enqueues durable recovery jobs into PostgreSQL repository.
    DOES NOT execute recovery actions directly.
    """

    def __init__(self, repository: Optional[JobRepository] = None) -> None:
        self.repository = repository

    def enqueue_job(
        self,
        session: Session,
        case_id: str,
        payment_id: str,
        customer_id: str,
        job_type: JobType = JobType.RECOVERY_CYCLE,
        priority: str = "MEDIUM",
        correlation_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> RecoveryJob:
        """Enqueues a durable RecoveryJob in database without executing financial actions."""
        repo = self.repository or JobRepository(session)
        corr_id = correlation_id or f"corr_{uuid.uuid4().hex[:12]}"
        idemp_key = idempotency_key or f"ik_job_{case_id}_1"

        # Check existing job
        existing = repo.get_job_by_idempotency_key(idemp_key)
        if existing:
            return existing

        job_id = f"job_{case_id}_{uuid.uuid4().hex[:8]}"
        job = RecoveryJob(
            job_id=job_id,
            case_id=case_id,
            payment_id=payment_id,
            customer_id=customer_id,
            job_type=job_type,
            status=JobStatus.QUEUED,
            priority=priority,
            attempt_count=1,
            max_attempts=3,
            available_at=datetime.now(timezone.utc),
            correlation_id=corr_id,
            idempotency_key=idemp_key,
        )

        saved_job = repo.create_job(job)

        # Audit event
        audit_repo = PostgresAuditRepository(session)
        audit_event = AuditEventModel(
            id=f"aud_{uuid.uuid4().hex[:12]}",
            event_type=AuditEventType.JOB_CREATED.value,
            aggregate_id=job_id,
            case_id=case_id,
            payment_id=payment_id,
            payload=json.dumps({
                "job_id": job_id,
                "job_type": job_type.value,
                "priority": priority,
                "idempotency_key": idemp_key,
            }),
            timestamp=datetime.now(timezone.utc),
            correlation_id=corr_id,
        )
        audit_repo.save_event(audit_event)
        session.commit()

        # Telemetry
        telemetry_registry.increment("jobs.created")
        telemetry_registry.set_gauge("jobs.queue_depth", repo.count_by_status(JobStatus.QUEUED))

        return saved_job
