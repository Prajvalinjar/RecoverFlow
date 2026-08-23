from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.workers.worker_registry import WorkerRegistry
from app.workers.worker_identity import WorkerStatus


@dataclass(frozen=True)
class WorkerFleetHealth:
    total_registered: int
    active_count: int
    running_count: int
    draining_count: int
    lost_count: int
    is_fleet_degraded: bool
    checked_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_registered": self.total_registered,
            "active_count": self.active_count,
            "running_count": self.running_count,
            "draining_count": self.draining_count,
            "lost_count": self.lost_count,
            "is_fleet_degraded": self.is_fleet_degraded,
            "checked_at": self.checked_at.isoformat(),
        }


def check_worker_fleet_health(session: Session, stale_timeout_seconds: float = 30.0) -> WorkerFleetHealth:
    registry = WorkerRegistry(session)
    registry.detect_stale_workers(timeout_seconds=stale_timeout_seconds)

    workers = registry.get_workers()
    total = len(workers)
    active = sum(1 for w in workers if w.is_active)
    running = sum(1 for w in workers if w.status == WorkerStatus.RUNNING)
    draining = sum(1 for w in workers if w.status == WorkerStatus.DRAINING)
    lost = sum(1 for w in workers if w.status == WorkerStatus.LOST)

    is_degraded = lost > 0 or (active == 0 and total > 0)
    return WorkerFleetHealth(
        total_registered=total,
        active_count=active,
        running_count=running,
        draining_count=draining,
        lost_count=lost,
        is_fleet_degraded=is_degraded,
    )
