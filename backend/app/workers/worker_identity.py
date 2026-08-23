import os
import socket
import uuid
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, List


class WorkerStatus(str, Enum):
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    DRAINING = "DRAINING"
    STOPPED = "STOPPED"
    LOST = "LOST"


@dataclass
class WorkerIdentity:
    """Domain model representing a unique distributed worker node."""

    worker_id: str = field(default_factory=lambda: f"worker_{uuid.uuid4().hex[:8]}")
    hostname: str = field(default_factory=lambda: socket.gethostname())
    process_id: int = field(default_factory=lambda: os.getpid())
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_heartbeat_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    status: WorkerStatus = WorkerStatus.STARTING
    capabilities: List[str] = field(default_factory=lambda: ["RECOVERY_CYCLE", "RECONCILIATION"])
    version: str = "1.0.0"

    def __post_init__(self) -> None:
        if not str(self.worker_id).strip():
            raise ValueError("worker_id cannot be empty.")

    @property
    def is_active(self) -> bool:
        return self.status in (WorkerStatus.STARTING, WorkerStatus.RUNNING, WorkerStatus.DRAINING)

    def heartbeat(self, current_time: Optional[datetime] = None) -> None:
        self.last_heartbeat_at = current_time or datetime.now(timezone.utc)
