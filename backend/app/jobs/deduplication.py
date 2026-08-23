import json
from typing import Tuple, Optional
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session

from app.jobs.job import RecoveryJob
from app.repository.job_repository import JobRepository
from app.domain.audit import AuditEventType
from app.repository.postgres import PostgresAuditRepository
from app.repository.models import AuditEventModel
from app.observability.telemetry import telemetry_registry


class JobDeduplicationService:
    """Thread-safe, transaction-aware duplicate job suppression service."""

    def __init__(self, repository: Optional[JobRepository] = None) -> None:
        self.repository = repository

    def check_or_register(
        self,
        session: Session,
        idempotency_key: str,
        case_id: str,
        payment_id: str,
        correlation_id: Optional[str] = None,
    ) -> Tuple[bool, Optional[RecoveryJob]]:
        """Checks if a job with idempotency_key already exists.

        Returns:
            (is_duplicate, existing_job)
        """
        repo = self.repository or JobRepository(session)
        existing = repo.get_job_by_idempotency_key(idempotency_key)

        if existing:
            corr_id = correlation_id or existing.correlation_id or f"corr_{uuid.uuid4().hex[:12]}"
            audit_repo = PostgresAuditRepository(session)
            audit_repo.save_event(
                AuditEventModel(
                    id=f"aud_dedup_{uuid.uuid4().hex[:12]}",
                    event_type=AuditEventType.JOB_DEDUPLICATED.value if hasattr(AuditEventType, "JOB_DEDUPLICATED") else "JOB_DEDUPLICATED",
                    aggregate_id=existing.job_id,
                    case_id=case_id,
                    payment_id=payment_id,
                    payload=json.dumps({
                        "idempotency_key": idempotency_key,
                        "existing_job_id": existing.job_id,
                        "existing_status": existing.status.value,
                    }),
                    timestamp=datetime.now(timezone.utc),
                    correlation_id=corr_id,
                )
            )
            session.commit()
            telemetry_registry.increment("jobs.duplicate_suppressed")
            return True, existing

        return False, None
