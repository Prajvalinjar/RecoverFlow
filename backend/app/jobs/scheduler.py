from enum import Enum
from typing import List, Optional
from datetime import datetime, timezone

from app.jobs.job import RecoveryJob


class JobPriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    NORMAL = "NORMAL"
    LOW = "LOW"

    @property
    def rank(self) -> int:
        ranks = {
            JobPriority.CRITICAL: 4,
            JobPriority.HIGH: 3,
            JobPriority.NORMAL: 2,
            JobPriority.LOW: 1,
        }
        return ranks.get(self, 2)


class PriorityScheduler:
    """Deterministic priority scheduler with age-based anti-starvation boost.

    Effective priority formula:
      effective_priority = base_priority_rank + math.floor(age_seconds * 0.1)

    Higher effective priority jobs execute first. In case of a tie, older jobs execute first.
    """

    @staticmethod
    def calculate_effective_priority(job: RecoveryJob, current_time: Optional[datetime] = None) -> float:
        now = current_time or datetime.now(timezone.utc)
        base_rank = 2
        p_str = (job.priority or "NORMAL").upper()
        if p_str == "CRITICAL":
            base_rank = 4
        elif p_str == "HIGH":
            base_rank = 3
        elif p_str == "NORMAL":
            base_rank = 2
        elif p_str == "LOW":
            base_rank = 1

        created_at = job.created_at or now
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        age_seconds = max(0.0, (now - created_at).total_seconds())
        age_boost = int(age_seconds * 0.1)
        return float(base_rank + age_boost)

    def sort_jobs_by_priority(
        self,
        jobs: List[RecoveryJob],
        current_time: Optional[datetime] = None,
    ) -> List[RecoveryJob]:
        """Sorts jobs deterministically by effective_priority descending, then created_at ascending."""
        now = current_time or datetime.now(timezone.utc)
        return sorted(
            jobs,
            key=lambda j: (
                -self.calculate_effective_priority(j, now),
                j.created_at or now,
                j.job_id,
            ),
        )

    def select_next_job(
        self,
        jobs: List[RecoveryJob],
        current_time: Optional[datetime] = None,
    ) -> Optional[RecoveryJob]:
        if not jobs:
            return None
        sorted_jobs = self.sort_jobs_by_priority(jobs, current_time)
        return sorted_jobs[0]
