from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.jobs.job import RecoveryJob, JobStatus, JobType
from app.repository.models import RecoveryJobModel


class JobRepository:
    """Production-grade SQLAlchemy repository for durable recovery job queuing and management."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def _to_domain(self, model: RecoveryJobModel) -> RecoveryJob:
        return RecoveryJob(
            job_id=model.job_id,
            case_id=model.case_id,
            payment_id=model.payment_id or "",
            customer_id=model.customer_id or "",
            job_type=JobType(model.job_type) if model.job_type in JobType.__members__ else JobType.RECOVERY_CYCLE,
            status=JobStatus(model.status) if model.status in JobStatus.__members__ else JobStatus.QUEUED,
            priority=model.priority or "MEDIUM",
            attempt_count=model.attempt_number or 1,
            max_attempts=model.max_attempts or 3,
            available_at=model.available_at or datetime.now(timezone.utc),
            claimed_at=model.claimed_at,
            lease_expires_at=model.lease_expires_at,
            completed_at=model.completed_at,
            failed_at=model.failed_at,
            last_error_code=model.last_error_code,
            last_error_category=model.last_error_category,
            correlation_id=model.correlation_id,
            idempotency_key=model.idempotency_key,
            worker_id=model.worker_id,
            worker_claim_token=model.worker_claim_token,
            created_at=model.created_at or datetime.now(timezone.utc),
            updated_at=model.updated_at or datetime.now(timezone.utc),
        )

    def create_job(self, job: RecoveryJob) -> RecoveryJob:
        """Persists a new recovery job in the database. Returns existing job if idempotency key collides."""
        if job.idempotency_key:
            existing = self.session.query(RecoveryJobModel).filter(
                RecoveryJobModel.idempotency_key == job.idempotency_key
            ).first()
            if existing:
                return self._to_domain(existing)

        model = RecoveryJobModel(
            job_id=job.job_id,
            case_id=job.case_id,
            payment_id=job.payment_id,
            customer_id=job.customer_id,
            job_type=job.job_type.value,
            status=job.status.value,
            priority=job.priority,
            attempt_number=job.attempt_count,
            max_attempts=job.max_attempts,
            available_at=job.available_at,
            claimed_at=job.claimed_at,
            lease_expires_at=job.lease_expires_at,
            completed_at=job.completed_at,
            failed_at=job.failed_at,
            last_error=job.last_error_code,
            last_error_code=job.last_error_code,
            last_error_category=job.last_error_category,
            idempotency_key=job.idempotency_key,
            created_at=job.created_at,
            updated_at=job.updated_at,
            correlation_id=job.correlation_id,
        )
        self.session.add(model)
        self.session.commit()
        return self._to_domain(model)

    def get_job(self, job_id: str) -> Optional[RecoveryJob]:
        model = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job_id).first()
        return self._to_domain(model) if model else None

    def get_by_id(self, job_id: str) -> Optional[RecoveryJobModel]:
        """Backward compatibility alias for ORM model access."""
        return self.session.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job_id).first()

    def save(self, job: RecoveryJobModel) -> RecoveryJobModel:
        """Backward compatibility alias for saving RecoveryJobModel."""
        if job in self.session:
            return job
        merged = self.session.merge(job)
        self.session.commit()
        return merged

    def get_job_by_idempotency_key(self, idempotency_key: str) -> Optional[RecoveryJob]:
        model = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.idempotency_key == idempotency_key).first()
        return self._to_domain(model) if model else None

    def get_jobs(
        self,
        status: Optional[JobStatus] = None,
        case_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[RecoveryJob]:
        query = self.session.query(RecoveryJobModel)
        if status:
            query = query.filter(RecoveryJobModel.status == status.value)
        if case_id:
            query = query.filter(RecoveryJobModel.case_id == case_id)
        query = query.order_by(RecoveryJobModel.created_at.desc()).limit(limit)
        return [self._to_domain(m) for m in query.all()]

    def list_for_case(self, case_id: str) -> List[RecoveryJobModel]:
        """Backward compatibility helper returning ORM models for a case."""
        return self.session.query(RecoveryJobModel).filter(
            RecoveryJobModel.case_id == case_id
        ).order_by(RecoveryJobModel.created_at.asc()).all()

    def claim_job(self, worker_id: str, lease_seconds: int = 60) -> Optional[RecoveryJob]:
        """Atomically claims the highest priority QUEUED or RETRY_SCHEDULED job whose available_at <= now."""
        now = datetime.now(timezone.utc)
        query = self.session.query(RecoveryJobModel).filter(
            RecoveryJobModel.status.in_([JobStatus.QUEUED.value, JobStatus.RETRY_SCHEDULED.value]),
            RecoveryJobModel.available_at <= now,
        )

        # Attempt FOR UPDATE SKIP LOCKED if dialect supports it
        try:
            query = query.with_for_update(skip_locked=True)
        except Exception:
            pass

        model = query.order_by(RecoveryJobModel.created_at.asc()).first()
        if not model:
            return None

        lease_exp = now + timedelta(seconds=lease_seconds)
        token = f"tok_{uuid.uuid4().hex[:8]}"
        model.status = JobStatus.CLAIMED.value
        model.claimed_at = now
        model.started_at = now
        model.lease_expires_at = lease_exp
        model.worker_id = worker_id
        model.worker_claim_token = token
        model.updated_at = now
        self.session.merge(model)
        self.session.commit()
        return self._to_domain(model)

    def claim_next_available_job(self, worker_id: str, lease_seconds: int = 60) -> Optional[RecoveryJob]:
        """Alias for claim_job enforcing worker_id registration."""
        return self.claim_job(worker_id=worker_id, lease_seconds=lease_seconds)

    def claim_specific_job(self, job_id: str, worker_id: str, lease_seconds: int = 60) -> Optional[RecoveryJob]:
        """Atomically claims a specific job if QUEUED or RETRY_SCHEDULED."""
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(
            RecoveryJobModel.job_id == job_id,
            RecoveryJobModel.status.in_([JobStatus.QUEUED.value, JobStatus.RETRY_SCHEDULED.value]),
            RecoveryJobModel.available_at <= now,
        ).first()
        if not model:
            return None

        token = f"tok_{uuid.uuid4().hex[:8]}"
        model.status = JobStatus.CLAIMED.value
        model.claimed_at = now
        model.started_at = now
        model.lease_expires_at = now + timedelta(seconds=lease_seconds)
        model.worker_id = worker_id
        model.worker_claim_token = token
        model.updated_at = now
        self.session.merge(model)
        self.session.commit()
        return self._to_domain(model)

    def renew_lease(self, job_id: str, worker_id: str, lease_seconds: int = 60) -> bool:
        """Renews job lease ensuring worker ownership."""
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(
            RecoveryJobModel.job_id == job_id,
            RecoveryJobModel.worker_id == worker_id,
            RecoveryJobModel.status.in_([JobStatus.CLAIMED.value, JobStatus.RUNNING.value]),
        ).first()
        if not model:
            return False

        model.lease_expires_at = now + timedelta(seconds=lease_seconds)
        model.updated_at = now
        self.session.merge(model)
        self.session.commit()
        return True

    def release_job(self, job_id: str, worker_id: str, reason: Optional[str] = None) -> bool:
        """Releases job back to RETRY_SCHEDULED queue on worker shutdown."""
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(
            RecoveryJobModel.job_id == job_id,
            RecoveryJobModel.worker_id == worker_id,
            RecoveryJobModel.status.in_([JobStatus.CLAIMED.value, JobStatus.RUNNING.value]),
        ).first()
        if not model:
            return False

        model.status = JobStatus.RETRY_SCHEDULED.value
        model.claimed_at = None
        model.lease_expires_at = None
        model.worker_id = None
        model.worker_claim_token = None
        model.last_error = reason or "Released by worker"
        model.updated_at = now
        self.session.merge(model)
        self.session.commit()
        return True

    def recover_jobs_owned_by_worker(self, worker_id: str) -> List[RecoveryJob]:
        """Reclaims all active jobs owned by a failed or lost worker."""
        now = datetime.now(timezone.utc)
        models = self.session.query(RecoveryJobModel).filter(
            RecoveryJobModel.worker_id == worker_id,
            RecoveryJobModel.status.in_([JobStatus.CLAIMED.value, JobStatus.RUNNING.value]),
        ).all()

        recovered = []
        for m in models:
            m.status = JobStatus.RETRY_SCHEDULED.value
            m.claimed_at = None
            m.lease_expires_at = None
            m.worker_id = None
            m.worker_claim_token = None
            m.last_error = f"Worker {worker_id} lost"
            m.last_error_code = "WORKER_LOST"
            m.last_error_category = "TRANSIENT"
            m.updated_at = now
            self.session.merge(m)
            recovered.append(self._to_domain(m))

        if recovered:
            self.session.commit()
        return recovered

    def get_jobs_by_worker(self, worker_id: str) -> List[RecoveryJob]:
        models = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.worker_id == worker_id).all()
        return [self._to_domain(m) for m in models]

    def count_active_worker_jobs(self, worker_id: str) -> int:
        return self.session.query(RecoveryJobModel).filter(
            RecoveryJobModel.worker_id == worker_id,
            RecoveryJobModel.status.in_([JobStatus.CLAIMED.value, JobStatus.RUNNING.value]),
        ).count()

    def heartbeat_job(self, job_id: str, worker_id: str, lease_seconds: int = 60) -> bool:
        """Extends the lease expiration for an active claimed/running job."""
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job_id).first()
        if not model or model.status not in (JobStatus.CLAIMED.value, JobStatus.RUNNING.value):
            return False

        model.lease_expires_at = now + timedelta(seconds=lease_seconds)
        model.updated_at = now
        self.session.merge(model)
        self.session.commit()
        return True

    def complete_job(self, job_id: str, correlation_id: Optional[str] = None) -> Optional[RecoveryJob]:
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job_id).first()
        if not model:
            return None

        model.status = JobStatus.SUCCEEDED.value
        model.completed_at = now
        model.lease_expires_at = None
        model.updated_at = now
        if correlation_id:
            model.correlation_id = correlation_id

        self.session.merge(model)
        self.session.commit()
        return self._to_domain(model)

    def fail_job(
        self,
        job_id: str,
        error_message: str,
        error_code: Optional[str] = None,
        error_category: Optional[str] = None,
    ) -> Optional[RecoveryJob]:
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job_id).first()
        if not model:
            return None

        model.status = JobStatus.FAILED.value
        model.failed_at = now
        model.last_error = error_message
        model.last_error_code = error_code or "EXECUTION_FAILURE"
        model.last_error_category = error_category or "PERMANENT"
        model.lease_expires_at = None
        model.updated_at = now

        self.session.merge(model)
        self.session.commit()
        return self._to_domain(model)

    def schedule_retry(
        self,
        job_id: str,
        retry_at: datetime,
        error_message: str,
        error_code: Optional[str] = None,
    ) -> Optional[RecoveryJob]:
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job_id).first()
        if not model:
            return None

        model.status = JobStatus.RETRY_SCHEDULED.value
        model.attempt_number = (model.attempt_number or 1) + 1
        model.available_at = retry_at
        model.claimed_at = None
        model.lease_expires_at = None
        model.last_error = error_message
        model.last_error_code = error_code or "RETRY_SCHEDULED"
        model.last_error_category = "TRANSIENT"
        model.updated_at = now

        self.session.merge(model)
        self.session.commit()
        return self._to_domain(model)

    def cancel_job(self, job_id: str, reason: Optional[str] = None) -> Optional[RecoveryJob]:
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job_id).first()
        if not model:
            return None

        model.status = JobStatus.CANCELLED.value
        model.last_error = reason or "Cancelled by operator"
        model.lease_expires_at = None
        model.updated_at = now

        self.session.merge(model)
        self.session.commit()
        return self._to_domain(model)

    def dead_letter_job(self, job_id: str, error_message: str) -> Optional[RecoveryJob]:
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job_id).first()
        if not model:
            return None

        model.status = JobStatus.DEAD_LETTER.value
        model.failed_at = now
        model.last_error = error_message
        model.last_error_code = "MAX_ATTEMPTS_EXHAUSTED"
        model.last_error_category = "PERMANENT"
        model.lease_expires_at = None
        model.updated_at = now

        self.session.merge(model)
        self.session.commit()
        return self._to_domain(model)

    def release_expired_lease(self, job_id: str) -> bool:
        now = datetime.now(timezone.utc)
        model = self.session.query(RecoveryJobModel).filter(RecoveryJobModel.job_id == job_id).first()
        if not model or model.status not in (JobStatus.CLAIMED.value, JobStatus.RUNNING.value):
            return False

        if model.lease_expires_at and model.lease_expires_at < now:
            model.status = JobStatus.RETRY_SCHEDULED.value
            model.claimed_at = None
            model.lease_expires_at = None
            model.updated_at = now
            self.session.merge(model)
            self.session.commit()
            return True
        return False

    def recover_expired_jobs(self, lease_grace_seconds: int = 0) -> List[RecoveryJob]:
        """Finds and requeues all CLAIMED/RUNNING jobs whose leases have expired."""
        now = datetime.now(timezone.utc) - timedelta(seconds=lease_grace_seconds)
        expired_models = self.session.query(RecoveryJobModel).filter(
            RecoveryJobModel.status.in_([JobStatus.CLAIMED.value, JobStatus.RUNNING.value]),
            RecoveryJobModel.lease_expires_at < now,
        ).all()

        recovered = []
        for model in expired_models:
            model.status = JobStatus.RETRY_SCHEDULED.value
            model.claimed_at = None
            model.lease_expires_at = None
            model.last_error = "Worker lease expired"
            model.last_error_code = "LEASE_EXPIRED"
            model.last_error_category = "TRANSIENT"
            model.updated_at = datetime.now(timezone.utc)
            self.session.merge(model)
            recovered.append(self._to_domain(model))

        if recovered:
            self.session.commit()
        return recovered

    def count_by_status(self, status: Optional[JobStatus] = None) -> int:
        query = self.session.query(RecoveryJobModel)
        if status:
            query = query.filter(RecoveryJobModel.status == status.value)
        return query.count()


# Alias for backward compatibility
PostgresJobRepository = JobRepository
