import json
import logging
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.workers.worker_identity import WorkerIdentity, WorkerStatus
from app.repository.models import WorkerModel, AuditEventModel
from app.domain.audit import AuditEventType
from app.repository.postgres import PostgresAuditRepository
from app.observability.telemetry import telemetry_registry

logger = logging.getLogger("recoverflow.workers.registry")


class WorkerRegistry:
    """Production-grade SQL repository for distributed worker identity tracking, heartbeats, and liveness sweeps."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def _to_domain(self, model: WorkerModel) -> WorkerIdentity:
        caps = []
        if model.capabilities:
            try:
                caps = json.loads(model.capabilities)
            except Exception:
                caps = ["RECOVERY_CYCLE"]
        return WorkerIdentity(
            worker_id=model.worker_id,
            hostname=model.hostname or "unknown",
            process_id=model.process_id or 0,
            started_at=model.started_at or datetime.now(timezone.utc),
            last_heartbeat_at=model.last_heartbeat_at or datetime.now(timezone.utc),
            status=WorkerStatus(model.status) if model.status in WorkerStatus.__members__ else WorkerStatus.STOPPED,
            capabilities=caps,
            version=model.version or "1.0.0",
        )

    def register_worker(self, worker: WorkerIdentity) -> WorkerIdentity:
        now = datetime.now(timezone.utc)
        model = self.session.query(WorkerModel).filter(WorkerModel.worker_id == worker.worker_id).first()
        if not model:
            model = WorkerModel(
                worker_id=worker.worker_id,
                hostname=worker.hostname,
                process_id=worker.process_id,
                status=worker.status.value,
                started_at=worker.started_at or now,
                last_heartbeat_at=now,
                capabilities=json.dumps(worker.capabilities),
                version=worker.version,
            )
            self.session.add(model)
        else:
            model.status = worker.status.value
            model.last_heartbeat_at = now
            model.capabilities = json.dumps(worker.capabilities)
            self.session.merge(model)

        self.session.commit()

        # Audit & Telemetry
        audit_repo = PostgresAuditRepository(self.session)
        audit_repo.save_event(
            AuditEventModel(
                id=f"aud_wrk_{now.timestamp()}",
                event_type=AuditEventType.WORKER_REGISTERED.value if hasattr(AuditEventType, "WORKER_REGISTERED") else "WORKER_REGISTERED",
                aggregate_id=worker.worker_id,
                case_id=worker.worker_id,
                payload=json.dumps({"hostname": worker.hostname, "process_id": worker.process_id}),
                timestamp=now,
            )
        )
        self.session.commit()
        telemetry_registry.increment("workers.registered")
        return self._to_domain(model)

    def heartbeat_worker(self, worker_id: str) -> bool:
        now = datetime.now(timezone.utc)
        model = self.session.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        if not model or model.status in (WorkerStatus.STOPPED.value, WorkerStatus.LOST.value):
            return False

        model.last_heartbeat_at = now
        self.session.merge(model)
        self.session.commit()
        return True

    def mark_draining(self, worker_id: str) -> bool:
        model = self.session.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        if not model:
            return False
        model.status = WorkerStatus.DRAINING.value
        model.last_heartbeat_at = datetime.now(timezone.utc)
        self.session.merge(model)
        self.session.commit()
        telemetry_registry.increment("workers.draining")
        return True

    def mark_stopped(self, worker_id: str) -> bool:
        model = self.session.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        if not model:
            return False
        model.status = WorkerStatus.STOPPED.value
        model.last_heartbeat_at = datetime.now(timezone.utc)
        self.session.merge(model)
        self.session.commit()
        telemetry_registry.increment("workers.stopped")
        return True

    def mark_lost(self, worker_id: str) -> bool:
        model = self.session.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        if not model:
            return False
        model.status = WorkerStatus.LOST.value
        self.session.merge(model)
        self.session.commit()
        telemetry_registry.increment("workers.lost")
        return True

    def get_worker(self, worker_id: str) -> Optional[WorkerIdentity]:
        model = self.session.query(WorkerModel).filter(WorkerModel.worker_id == worker_id).first()
        return self._to_domain(model) if model else None

    def get_workers(self) -> List[WorkerIdentity]:
        models = self.session.query(WorkerModel).order_by(WorkerModel.started_at.desc()).all()
        return [self._to_domain(m) for m in models]

    def get_active_workers(self) -> List[WorkerIdentity]:
        models = self.session.query(WorkerModel).filter(
            WorkerModel.status.in_([WorkerStatus.STARTING.value, WorkerStatus.RUNNING.value, WorkerStatus.DRAINING.value])
        ).all()
        return [self._to_domain(m) for m in models]

    def detect_stale_workers(self, timeout_seconds: float = 30.0) -> List[WorkerIdentity]:
        """Finds workers whose heartbeat is older than timeout_seconds and marks them LOST."""
        threshold = datetime.now(timezone.utc) - timedelta(seconds=timeout_seconds)
        stale_models = self.session.query(WorkerModel).filter(
            WorkerModel.status.in_([WorkerStatus.STARTING.value, WorkerStatus.RUNNING.value, WorkerStatus.DRAINING.value]),
            WorkerModel.last_heartbeat_at < threshold,
        ).all()

        lost_workers = []
        for model in stale_models:
            model.status = WorkerStatus.LOST.value
            self.session.merge(model)
            lost_workers.append(self._to_domain(model))
            telemetry_registry.increment("workers.lost")

        if lost_workers:
            self.session.commit()
            logger.warning("Detected %d lost/stale workers", len(lost_workers))

        return lost_workers
