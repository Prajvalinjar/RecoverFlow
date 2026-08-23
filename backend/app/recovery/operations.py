from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Any
from threading import Lock
from sqlalchemy.orm import Session

from app.domain.audit import AuditEvent, AuditEventType
from app.repository.postgres import PostgresAuditRepository
from app.repository.models import AuditEventModel
import json
import uuid


class RecoveryOperationStatus(str, Enum):
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    DRAINING = "DRAINING"
    STOPPED = "STOPPED"


class RecoveryOperationsController:
    """Thread-safe controller managing high-level system recovery processing state.
    
    Rules:
    - RUNNING: New recovery jobs may execute.
    - PAUSED: New recovery jobs MUST NOT execute.
    - DRAINING: Existing active work finishes, new work blocked.
    - STOPPED: No recovery execution allowed.
    - Audit: All operational state changes emit an AuditEvent.
    - Safety: Pausing does NOT modify completed executions, historical outcomes, or cases.
    """

    _instance = None
    _lock = Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(RecoveryOperationsController, cls).__new__(cls)
                cls._instance._status = RecoveryOperationStatus.RUNNING
                cls._instance._changed_at = datetime.utcnow()
                cls._instance._changed_by = "SYSTEM"
                cls._instance._reason = "Initial operational start."
            return cls._instance

    @property
    def status(self) -> RecoveryOperationStatus:
        with self._lock:
            return self._status

    def can_execute_new_jobs(self) -> bool:
        with self._lock:
            return self._status == RecoveryOperationStatus.RUNNING

    def pause(self, reason: str = "Operator paused recovery processing.", actor: str = "OPERATOR", session: Optional[Session] = None) -> RecoveryOperationStatus:
        with self._lock:
            if self._status == RecoveryOperationStatus.PAUSED:
                return self._status
            self._status = RecoveryOperationStatus.PAUSED
            self._changed_at = datetime.utcnow()
            self._changed_by = actor
            self._reason = reason

            self._record_audit_event(AuditEventType.RECOVERY_PAUSED, reason, actor, session)
            return self._status

    def resume(self, reason: str = "Operator resumed recovery processing.", actor: str = "OPERATOR", session: Optional[Session] = None) -> RecoveryOperationStatus:
        with self._lock:
            if self._status == RecoveryOperationStatus.RUNNING:
                return self._status
            self._status = RecoveryOperationStatus.RUNNING
            self._changed_at = datetime.utcnow()
            self._changed_by = actor
            self._reason = reason

            self._record_audit_event(AuditEventType.RECOVERY_RESUMED, reason, actor, session)
            return self._status

    def stop(self, reason: str = "Operator stopped recovery system.", actor: str = "OPERATOR", session: Optional[Session] = None) -> RecoveryOperationStatus:
        with self._lock:
            if self._status == RecoveryOperationStatus.STOPPED:
                return self._status
            self._status = RecoveryOperationStatus.STOPPED
            self._changed_at = datetime.utcnow()
            self._changed_by = actor
            self._reason = reason

            self._record_audit_event(AuditEventType.RECOVERY_STOPPED, reason, actor, session)
            return self._status

    def reset_for_tests(self) -> None:
        with self._lock:
            self._status = RecoveryOperationStatus.RUNNING
            self._changed_at = datetime.utcnow()

    def _record_audit_event(self, event_type: AuditEventType, reason: str, actor: str, session: Optional[Session] = None) -> None:
        if session:
            corr_id = f"corr_ops_{uuid.uuid4().hex[:8]}"
            audit_repo = PostgresAuditRepository(session)
            audit_model = AuditEventModel(
                id=f"aud_ops_{uuid.uuid4().hex[:12]}",
                event_type=event_type.value,
                aggregate_id="RECOVERY_OPERATIONS",
                payload=json.dumps({"reason": reason, "actor": actor, "status": self._status.value}),
                timestamp=datetime.utcnow(),
                correlation_id=corr_id,
            )
            audit_repo.save_event(audit_model)
            session.commit()
