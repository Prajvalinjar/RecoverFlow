from datetime import datetime, timezone, timedelta
from app.jobs.job import RecoveryJob
from app.jobs.scheduler import PriorityScheduler, JobPriority


def test_priority_scheduler_effective_priority_calculation() -> None:
    scheduler = PriorityScheduler()
    now = datetime.now(timezone.utc)
    j_high = RecoveryJob(job_id="j1", case_id="c1", payment_id="p1", customer_id="cust1", priority="HIGH", created_at=now)
    j_low = RecoveryJob(job_id="j2", case_id="c1", payment_id="p1", customer_id="cust1", priority="LOW", created_at=now)

    eff_high = scheduler.calculate_effective_priority(j_high, now)
    eff_low = scheduler.calculate_effective_priority(j_low, now)
    assert eff_high > eff_low


def test_priority_scheduler_anti_starvation_boost() -> None:
    scheduler = PriorityScheduler()
    now = datetime.now(timezone.utc)
    # Low priority job created 100 seconds ago (age boost = +10)
    old_low = RecoveryJob(
        job_id="j_old",
        case_id="c1",
        payment_id="p1",
        customer_id="cust1",
        priority="LOW",
        created_at=now - timedelta(seconds=100),
    )
    # High priority job created just now (rank = 3)
    new_high = RecoveryJob(
        job_id="j_new",
        case_id="c1",
        payment_id="p1",
        customer_id="cust1",
        priority="HIGH",
        created_at=now,
    )

    eff_old = scheduler.calculate_effective_priority(old_low, now)
    eff_new = scheduler.calculate_effective_priority(new_high, now)

    # Aged low priority job has boost (1 + 10 = 11) > new high (3)
    assert eff_old > eff_new
    next_selected = scheduler.select_next_job([new_high, old_low], now)
    assert next_selected.job_id == "j_old"
