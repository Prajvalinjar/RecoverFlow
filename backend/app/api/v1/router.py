import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.security.event_auth import verify_event_authentication
from app.security.operations_auth import (
    verify_operations_read,
    verify_operations_write,
    verify_operations_admin,
    OperationalRole,
)
from app.api.schemas.events import PaymentFailureEvent, EventProcessingResponse
from app.events.processor import PaymentEventProcessor
from app.observability.health import HealthCheckService
from app.observability.telemetry import telemetry_registry
from app.observability.recovery_metrics import RecoveryMetricsService
from app.execution.provider_health import ProviderHealthMonitor
from app.recovery.operations import RecoveryOperationsController
from app.recovery.job_operations import RecoveryJobOperationsService, InvalidJobStateOperationError
from app.repository.postgres import (
    PostgresRecoveryCaseRepository,
    PostgresPaymentRepository,
    PostgresCustomerRepository,
    PostgresAuditRepository,
    PostgresRecoveryExecutionRepository,
    PostgresRecoveryJobRepository,
)

api_v1_router = APIRouter(prefix="/api/v1", tags=["V1 API"])
ops_controller = RecoveryOperationsController()
provider_monitor = ProviderHealthMonitor()


@api_v1_router.get("/health")
def api_health() -> Dict[str, str]:
    """API V1 Health Check."""
    return {"status": "ok", "service": "recoverflow-api", "version": "1.0.0"}


@api_v1_router.get("/metrics")
def get_metrics() -> Dict[str, Any]:
    """Read-only operational telemetry metrics endpoint."""
    return {
        "status": "ok",
        "service": "recoverflow-api",
        "metrics": telemetry_registry.snapshot(),
    }


from fastapi import Request, Header
from app.events.processor import AuthenticatedEventContext
from app.security.replay import replay_protection_service, ReplayStatus
from app.security.rate_limit import enforce_rate_limit, RateLimitCategory


@api_v1_router.post(
    "/events/payment-failure",
    response_model=EventProcessingResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(enforce_rate_limit(RateLimitCategory.WEBHOOK)),
        Depends(verify_event_authentication),
    ],
)
async def ingest_payment_failure_event(
    event: PaymentFailureEvent,
    request: Request,
    db: Session = Depends(get_db),
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
    x_signature_timestamp: Optional[str] = Header(None, alias="X-Signature-Timestamp"),
) -> EventProcessingResponse:
    """Production idempotent payment failure webhook event ingestion endpoint."""
    correlation_id = getattr(request.state, "correlation_id", None)
    signature_header = x_signature or request.headers.get("X-Razorpay-Signature")
    if signature_header or x_signature_timestamp:
        parsed_ts: Optional[float] = None
        if x_signature_timestamp:
            try:
                parsed_ts = float(x_signature_timestamp)
            except ValueError:
                pass

        sig_or_id = signature_header or event.event_id
        replay_result = replay_protection_service.check_and_record(
            signature_or_id=sig_or_id, timestamp=parsed_ts
        )

        if replay_result.status == ReplayStatus.TIMESTAMP_EXPIRED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": "EXPIRED_WEBHOOK",
                    "message": replay_result.message,
                    "correlation_id": correlation_id,
                },
            )

        if replay_result.status == ReplayStatus.REPLAY_REJECTED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": "REPLAY_REJECTED",
                    "message": replay_result.message,
                    "correlation_id": correlation_id,
                },
            )

    sec_context = AuthenticatedEventContext(
        provider="SIMULATED_PROVIDER",
        event_id=event.event_id,
        authenticated=True,
        correlation_id=correlation_id,
        signature_verified=True,
        replay_checked=True,
    )

    processor = PaymentEventProcessor(db)
    response = processor.process_event(event, trigger_recovery=True, security_context=sec_context)
    return response


# ============================================================================
# PHASE 1H — OPERATIONS & RELIABILITY ENDPOINTS
# ============================================================================

@api_v1_router.get(
    "/operations/health",
    dependencies=[Depends(enforce_rate_limit(RateLimitCategory.OPERATIONS)), Depends(verify_operations_read)],
)
def get_operations_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Read-only system health inspection endpoint."""
    service = HealthCheckService(provider_health_monitor=provider_monitor)
    system_health = service.check_system_health(db)
    return {
        "overall_status": system_health.overall_status.value,
        "checked_at": system_health.checked_at.isoformat(),
        "components": [
            {
                "name": c.component_name,
                "status": c.status.value,
                "message": c.message,
                "latency_ms": c.latency_ms,
                "metadata": c.metadata,
            }
            for c in system_health.components
        ],
    }


@api_v1_router.get(
    "/operations/metrics",
    dependencies=[Depends(enforce_rate_limit(RateLimitCategory.OPERATIONS)), Depends(verify_operations_read)],
)
def get_operations_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Read-only aggregated domain metrics endpoint."""
    case_repo = PostgresRecoveryCaseRepository(db)
    payment_repo = PostgresPaymentRepository(db)
    metrics_service = RecoveryMetricsService(case_repo=case_repo, payment_repo=payment_repo)
    metrics = metrics_service.get_metrics()
    return {
        "total_cases": metrics.total_cases,
        "active_cases": metrics.active_cases,
        "recovered_cases": metrics.recovered_cases,
        "failed_cases": metrics.failed_cases,
        "escalated_cases": metrics.escalated_cases,
        "stopped_cases": metrics.stopped_cases,
        "revenue_at_risk": str(metrics.revenue_at_risk),
        "revenue_recovered": str(metrics.revenue_recovered),
        "recovery_rate_percent": round(metrics.recovery_rate, 2),
        "average_attempts": round(metrics.average_attempts, 2),
        "telemetry_snapshot": telemetry_registry.snapshot(),
    }


@api_v1_router.get("/operations/providers", dependencies=[Depends(verify_operations_read)])
def get_operations_providers() -> Dict[str, Any]:
    """Read-only provider health status endpoint."""
    sim_health = provider_monitor.get_health("SIMULATED_PROVIDER")
    return {
        "providers": [
            {
                "provider_name": sim_health.provider_name,
                "status": sim_health.status.value,
                "consecutive_failures": sim_health.consecutive_failures,
                "consecutive_successes": sim_health.consecutive_successes,
                "last_success_at": sim_health.last_success_at.isoformat() if sim_health.last_success_at else None,
                "last_failure_at": sim_health.last_failure_at.isoformat() if sim_health.last_failure_at else None,
                "last_error": sim_health.last_error,
            }
        ]
    }


@api_v1_router.get("/operations/recovery/status", dependencies=[Depends(verify_operations_read)])
def get_operations_recovery_status() -> Dict[str, Any]:
    """Read-only operational pause/resume state endpoint."""
    return {
        "status": ops_controller.status.value,
        "can_execute_new_jobs": ops_controller.can_execute_new_jobs(),
    }


@api_v1_router.get("/operations/jobs", dependencies=[Depends(verify_operations_read)])
def get_operations_jobs(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Read-only recovery jobs list endpoint."""
    job_ops = RecoveryJobOperationsService(db)
    jobs = job_ops.list_jobs_by_status(status=status, limit=limit)
    return {
        "count": len(jobs),
        "jobs": [
            {
                "job_id": j.job_id,
                "case_id": j.case_id,
                "status": j.status,
                "attempt_number": j.attempt_number,
                "max_attempts": j.max_attempts,
                "last_error": j.last_error,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "correlation_id": j.correlation_id,
            }
            for j in jobs
        ],
    }


@api_v1_router.get("/operations/audit", dependencies=[Depends(verify_operations_read)])
def get_operations_audit(
    case_id: Optional[str] = Query(None),
    correlation_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Read-only operational audit search endpoint."""
    audit_repo = PostgresAuditRepository(db)
    if case_id:
        events = audit_repo.get_events_for_case(case_id)
    elif correlation_id:
        events = audit_repo.get_events_for_correlation(correlation_id)
    elif event_type:
        events = audit_repo.get_events_by_type(event_type)
    else:
        events = audit_repo.get_recent_events(limit=limit)

    records = []
    for rec in events:
        try:
            payload = json.loads(rec.payload)
        except Exception:
            payload = {"raw": rec.payload}
        records.append({
            "event_id": rec.id,
            "event_type": rec.event_type,
            "aggregate_id": rec.aggregate_id,
            "case_id": rec.case_id,
            "correlation_id": rec.correlation_id,
            "timestamp": rec.timestamp.isoformat() if rec.timestamp else None,
            "details": payload,
        })

    return {
        "count": len(records),
        "audit_events": records,
    }


@api_v1_router.get("/operations/cases/{case_id}/summary", dependencies=[Depends(verify_operations_read)])
def get_case_operations_summary(case_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Consolidated read-only operational summary endpoint for a case."""
    case_repo = PostgresRecoveryCaseRepository(db)
    execution_repo = PostgresRecoveryExecutionRepository(db)
    job_repo = PostgresRecoveryJobRepository(db)
    audit_repo = PostgresAuditRepository(db)

    case = case_repo.get_by_id(case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "CASE_NOT_FOUND", "message": f"Recovery case {case_id} not found."},
        )

    executions = execution_repo.list_for_case(case_id)
    jobs = job_repo.list_for_case(case_id)
    audits = audit_repo.get_events_for_case(case_id)

    return {
        "case_id": case.id,
        "state": case.state,
        "priority": case.priority,
        "attempt_count": case.attempt_count,
        "max_allowed_attempts": case.max_allowed_attempts,
        "terminal_reason": case.terminal_reason,
        "execution_count": len(executions),
        "job_count": len(jobs),
        "audit_event_count": len(audits),
        "latest_job_status": jobs[-1].status if jobs else None,
    }


@api_v1_router.post("/operations/recovery/pause")
def pause_recovery_operations(
    role: OperationalRole = Depends(verify_operations_write),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint pausing new recovery job processing."""
    new_status = ops_controller.pause(reason="Operator paused via API", actor=role.value, session=db)
    return {
        "status": new_status.value,
        "message": "Recovery processing successfully paused.",
    }


@api_v1_router.post("/operations/recovery/resume")
def resume_recovery_operations(
    role: OperationalRole = Depends(verify_operations_write),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint resuming recovery job processing."""
    new_status = ops_controller.resume(reason="Operator resumed via API", actor=role.value, session=db)
    return {
        "status": new_status.value,
        "message": "Recovery processing successfully resumed.",
    }


@api_v1_router.post("/operations/jobs/{job_id}/retry")
def retry_recovery_job(
    job_id: str,
    role: OperationalRole = Depends(verify_operations_write),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint requesting manual retry of an eligible failed job."""
    job_ops = RecoveryJobOperationsService(db)
    try:
        job = job_ops.retry_job(job_id=job_id, actor=role.value)
        return {
            "status": "success",
            "job_id": job.job_id,
            "job_status": job.status,
            "message": f"Job {job_id} scheduled for retry.",
        }
    except InvalidJobStateOperationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "INVALID_JOB_OPERATION", "message": str(exc)},
        )


@api_v1_router.get("/operations/jobs")
def list_operations_jobs(
    status: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    role: OperationalRole = Depends(verify_operations_read),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint listing recovery jobs."""
    job_ops = RecoveryJobOperationsService(db)
    query_status = status.upper() if status else None
    jobs = job_ops.list_jobs_by_status(status=query_status, limit=limit)
    if case_id:
        jobs = [j for j in jobs if j.case_id == case_id]

    items = []
    for j in jobs:
        items.append({
            "job_id": j.job_id,
            "case_id": j.case_id,
            "payment_id": getattr(j, "payment_id", ""),
            "job_type": getattr(j, "job_type", "RECOVERY_CYCLE"),
            "status": j.status,
            "priority": getattr(j, "priority", "MEDIUM"),
            "attempt_number": j.attempt_number,
            "max_attempts": j.max_attempts,
            "available_at": j.available_at.isoformat() if j.available_at else None,
            "claimed_at": j.claimed_at.isoformat() if getattr(j, "claimed_at", None) else None,
            "lease_expires_at": j.lease_expires_at.isoformat() if getattr(j, "lease_expires_at", None) else None,
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "correlation_id": j.correlation_id,
        })
    return {"count": len(items), "total": len(items), "jobs": items}


@api_v1_router.post("/operations/jobs/{job_id}/requeue")
def requeue_dead_letter_job(
    job_id: str,
    role: OperationalRole = Depends(verify_operations_write),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint requeuing a dead-lettered job."""
    job_ops = RecoveryJobOperationsService(db)
    try:
        job = job_ops.requeue_dead_letter(job_id=job_id, actor=role.value)
        return {
            "status": "success",
            "job_id": job.job_id,
            "job_status": job.status,
            "message": f"Dead-lettered job {job_id} requeued.",
        }
    except InvalidJobStateOperationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "INVALID_JOB_OPERATION", "message": str(exc)},
        )


@api_v1_router.post("/operations/jobs/recover-expired")
def recover_expired_job_leases(
    role: OperationalRole = Depends(verify_operations_write),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint triggering recovery of expired worker leases."""
    job_ops = RecoveryJobOperationsService(db)
    recovered = job_ops.recover_expired_jobs(actor=role.value)
    return {
        "status": "success",
        "recovered_count": len(recovered),
        "message": f"Recovered {len(recovered)} expired job leases.",
    }


@api_v1_router.get("/operations/workers")
def list_workers(
    role: OperationalRole = Depends(verify_operations_read),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint listing registered workers."""
    from app.workers.worker_registry import WorkerRegistry
    registry = WorkerRegistry(db)
    workers = registry.get_workers()
    items = [
        {
            "worker_id": w.worker_id,
            "hostname": w.hostname,
            "process_id": w.process_id,
            "status": w.status.value,
            "started_at": w.started_at.isoformat() if w.started_at else None,
            "last_heartbeat_at": w.last_heartbeat_at.isoformat() if w.last_heartbeat_at else None,
            "capabilities": w.capabilities,
            "version": w.version,
        }
        for w in workers
    ]
    return {"total": len(items), "workers": items}


@api_v1_router.get("/operations/workers/{worker_id}")
def get_worker_status(
    worker_id: str,
    role: OperationalRole = Depends(verify_operations_read),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint fetching worker details."""
    from app.workers.worker_registry import WorkerRegistry
    registry = WorkerRegistry(db)
    worker = registry.get_worker(worker_id)
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "WORKER_NOT_FOUND", "message": f"Worker {worker_id} not found."},
        )
    return {
        "worker_id": worker.worker_id,
        "hostname": worker.hostname,
        "process_id": worker.process_id,
        "status": worker.status.value,
        "started_at": worker.started_at.isoformat() if worker.started_at else None,
        "last_heartbeat_at": worker.last_heartbeat_at.isoformat() if worker.last_heartbeat_at else None,
        "capabilities": worker.capabilities,
        "version": worker.version,
    }


@api_v1_router.post("/operations/workers/{worker_id}/drain")
def drain_worker(
    worker_id: str,
    role: OperationalRole = Depends(verify_operations_write),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint marking a worker as DRAINING."""
    from app.workers.worker_registry import WorkerRegistry
    registry = WorkerRegistry(db)
    success = registry.mark_draining(worker_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "WORKER_NOT_FOUND", "message": f"Worker {worker_id} not found."},
        )
    return {"status": "success", "worker_id": worker_id, "message": f"Worker {worker_id} marked as DRAINING."}


@api_v1_router.get("/operations/queue/status")
def get_queue_status(
    role: OperationalRole = Depends(verify_operations_read),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint for queue status overview."""
    from app.repository.job_repository import JobRepository
    from app.jobs.job import JobStatus
    from app.jobs.backpressure import BackpressureController
    repo = JobRepository(db)
    queued = repo.count_by_status(JobStatus.QUEUED)
    claimed = repo.count_by_status(JobStatus.CLAIMED)
    succeeded = repo.count_by_status(JobStatus.SUCCEEDED)
    failed = repo.count_by_status(JobStatus.FAILED)
    dead = repo.count_by_status(JobStatus.DEAD_LETTER)

    bp_level = BackpressureController().evaluate(queued)

    return {
        "status": "healthy",
        "queued": queued,
        "claimed": claimed,
        "succeeded": succeeded,
        "failed": failed,
        "dead_letter": dead,
        "backpressure_level": bp_level.value,
    }


@api_v1_router.get("/operations/queue/reconciliation")
def get_queue_reconciliation(
    role: OperationalRole = Depends(verify_operations_read),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint previewing queue reconciliation metrics."""
    from app.jobs.reconciliation import JobQueueReconciliationService
    svc = JobQueueReconciliationService(db)
    report = svc.reconcile_queue()
    return report.to_dict()


@api_v1_router.post("/operations/queue/reconcile")
def run_queue_reconciliation(
    role: OperationalRole = Depends(verify_operations_write),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint executing queue reconciliation."""
    from app.jobs.reconciliation import JobQueueReconciliationService
    svc = JobQueueReconciliationService(db)
    report = svc.reconcile_queue()
    return {"status": "success", "report": report.to_dict()}


@api_v1_router.get("/operations/events")
def list_event_processing_records(
    role: OperationalRole = Depends(verify_operations_read),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint listing event processing records."""
    from app.repository.models import EventProcessingRecordModel
    records = db.query(EventProcessingRecordModel).order_by(EventProcessingRecordModel.processed_at.desc()).limit(50).all()
    items = [
        {
            "id": r.id,
            "event_id": r.event_id,
            "event_type": r.event_type,
            "consumer_name": r.consumer_name,
            "status": r.status,
            "correlation_id": r.correlation_id,
            "processed_at": r.processed_at.isoformat() if r.processed_at else None,
        }
        for r in records
    ]
    return {"total": len(items), "records": items}


@api_v1_router.get("/operations/backpressure")
def get_backpressure_status(
    role: OperationalRole = Depends(verify_operations_read),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint returning backpressure metrics."""
    from app.repository.job_repository import JobRepository
    from app.jobs.job import JobStatus
    from app.jobs.backpressure import BackpressureController
    repo = JobRepository(db)
    queued = repo.count_by_status(JobStatus.QUEUED)
    ctrl = BackpressureController()
    level = ctrl.evaluate(queued)
    return {
        "level": level.value,
        "queued_depth": queued,
        "recommended_delay_seconds": ctrl.recommended_delay_seconds(queued),
    }


@api_v1_router.get("/operations/providers")
def list_providers(
    role: OperationalRole = Depends(verify_operations_read),
) -> Dict[str, Any]:
    """Operator REST endpoint listing payment providers and active provider configuration."""
    from app.execution.provider_config import ProviderConfig
    from app.execution.provider_factory import get_active_provider
    cfg = ProviderConfig()
    active = get_active_provider(cfg)
    return {
        "active_provider": active.provider_name(),
        "config": cfg.sanitized_dict(),
        "available_providers": ["simulated", "razorpay"],
    }


@api_v1_router.get("/operations/providers/{provider}/health")
def get_provider_health(
    provider: str,
    role: OperationalRole = Depends(verify_operations_read),
) -> Dict[str, Any]:
    """Operator REST endpoint fetching provider health status."""
    from app.execution.provider_health import ProviderHealthMonitor
    monitor = ProviderHealthMonitor()
    health = monitor.get_health(provider)
    return {
        "provider": health.provider_name,
        "status": health.status.value,
        "consecutive_failures": health.consecutive_failures,
        "consecutive_successes": health.consecutive_successes,
        "last_error": health.last_error,
        "checked_at": health.checked_at.isoformat() if health.checked_at else None,
    }


@api_v1_router.get("/operations/executions/{execution_id}")
def get_execution_details(
    execution_id: str,
    role: OperationalRole = Depends(verify_operations_read),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Operator REST endpoint fetching recovery execution details."""
    from app.repository.models import RecoveryExecutionModel
    model = db.query(RecoveryExecutionModel).filter(RecoveryExecutionModel.execution_id == execution_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "EXECUTION_NOT_FOUND", "message": f"Execution {execution_id} not found."},
        )
    return {
        "execution_id": model.execution_id,
        "case_id": model.case_id,
        "action_type": model.action_type,
        "status": model.status,
        "provider": model.provider,
        "provider_reference": model.provider_reference,
        "provider_operation": model.provider_operation,
        "provider_status": model.provider_status,
        "amount": float(model.amount) if model.amount else None,
        "currency": model.currency,
        "error_code": model.error_code,
        "correlation_id": model.correlation_id,
        "created_at": model.created_at.isoformat() if model.created_at else None,
    }


# ============================================================================
# PREVIOUS CASE & PAYMENT ENDPOINTS (PRESERVED & EXPANDED)
# ============================================================================

@api_v1_router.get("/recovery/cases")
def list_recovery_cases(
    state: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Read-only endpoint listing recovery cases."""
    query = db.query(RecoveryCaseModel)
    if state:
        query = query.filter(RecoveryCaseModel.state == state.upper())
    cases = query.order_by(RecoveryCaseModel.created_at.desc()).limit(limit).all()

    payment_ids = [c.payment_id for c in cases if c.payment_id]
    customer_ids = [c.customer_id for c in cases if c.customer_id]

    payments = {p.id: p for p in db.query(PaymentModel).filter(PaymentModel.id.in_(payment_ids)).all()} if payment_ids else {}
    customers = {c.id: c for c in db.query(CustomerModel).filter(CustomerModel.id.in_(customer_ids)).all()} if customer_ids else {}

    items = []
    for c in cases:
        p_obj = payments.get(c.payment_id)
        c_obj = customers.get(c.customer_id)
        amt = float(p_obj.amount) if p_obj and p_obj.amount else 0.0
        items.append({
            "case_id": c.id,
            "payment_id": c.payment_id,
            "customer_id": c.customer_id,
            "customer_name": f"Cust-{c.customer_id[-6:]}" if c.customer_id else "Unknown",
            "amount": amt,
            "currency": p_obj.currency if p_obj else "INR",
            "failure_reason": p_obj.failure_code if p_obj else "BANK_TIMEOUT",
            "state": c.state,
            "attempt_count": c.attempt_count,
            "priority": c.priority,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        })
    return {"total": len(items), "cases": items}


@api_v1_router.get("/payments")
def list_payments(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Read-only endpoint listing payment transactions."""
    query = db.query(PaymentModel)
    if status:
        query = query.filter(PaymentModel.status == status.upper())
    payments = query.order_by(PaymentModel.created_at.desc()).limit(limit).all()

    items = []
    for p_obj in payments:
        items.append({
            "payment_id": p_obj.id,
            "customer_id": p_obj.customer_id,
            "amount": float(p_obj.amount) if p_obj.amount else 0.0,
            "currency": p_obj.currency,
            "status": p_obj.status,
            "failure_code": p_obj.failure_code,
            "provider": getattr(p_obj, "provider", "razorpay"),
            "created_at": p_obj.created_at.isoformat() if p_obj.created_at else None,
        })
    return {"total": len(items), "payments": items}


@api_v1_router.get("/recovery/cases/{case_id}")
def get_recovery_case(
    case_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Read-only observational endpoint for recovery case details."""
    case_repo = PostgresRecoveryCaseRepository(db)
    payment_repo = PostgresPaymentRepository(db)
    customer_repo = PostgresCustomerRepository(db)

    case = case_repo.get_by_id(case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "CASE_NOT_FOUND", "message": f"Recovery case {case_id} not found."},
        )

    payment = payment_repo.get_by_id(case.payment_id)
    customer = customer_repo.get_by_id(case.customer_id)

    return {
        "case_id": case.id,
        "payment_id": case.payment_id,
        "customer_id": case.customer_id,
        "state": case.state,
        "priority": case.priority,
        "attempt_count": case.attempt_count,
        "max_allowed_attempts": case.max_allowed_attempts,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        "terminal_reason": case.terminal_reason,
        "payment": {
            "amount": str(payment.amount) if payment else None,
            "currency": payment.currency if payment else None,
            "status": payment.status if payment else None,
            "failure_code": payment.failure_code if payment else None,
        } if payment else None,
        "customer": {
            "segment": customer.segment if customer else None,
            "total_spent": str(customer.total_spent) if customer else None,
        } if customer else None,
    }


@api_v1_router.get("/recovery/cases/{case_id}/timeline")
def get_recovery_case_timeline(
    case_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Read-only observational timeline endpoint for a recovery case."""
    case_repo = PostgresRecoveryCaseRepository(db)
    audit_repo = PostgresAuditRepository(db)

    case = case_repo.get_by_id(case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "CASE_NOT_FOUND", "message": f"Recovery case {case_id} not found."},
        )

    audit_records = audit_repo.get_timeline_for_case(case_id)
    timeline: List[Dict[str, Any]] = []

    for rec in audit_records:
        try:
            payload = json.loads(rec.payload)
        except Exception:
            payload = {"raw": rec.payload}

        timeline.append({
            "event_id": rec.id,
            "event_type": rec.event_type,
            "timestamp": rec.timestamp.isoformat() if rec.timestamp else None,
            "correlation_id": rec.correlation_id,
            "details": payload,
        })

    return {
        "case_id": case.id,
        "state": case.state,
        "event_count": len(timeline),
        "timeline": timeline,
    }


@api_v1_router.get("/payments/{payment_id}")
def get_payment_details(
    payment_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Read-only observational endpoint for payment transaction details."""
    payment_repo = PostgresPaymentRepository(db)
    case_repo = PostgresRecoveryCaseRepository(db)

    payment = payment_repo.get_by_id(payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "PAYMENT_NOT_FOUND", "message": f"Payment {payment_id} not found."},
        )

    case = case_repo.get_by_payment_id(payment_id)

    return {
        "payment_id": payment.id,
        "customer_id": payment.customer_id,
        "amount": str(payment.amount),
        "currency": payment.currency,
        "status": payment.status,
        "failure_code": payment.failure_code,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
        "recovery_case_id": case.id if case else None,
        "recovery_state": case.state if case else None,
    }


@api_v1_router.post("/recovery/cases/{case_id}/execute")
def execute_approved_case(
    case_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Triggers policy-approved execution for a case. Rejects terminal cases or unapproved policies."""
    case_repo = PostgresRecoveryCaseRepository(db)
    case = case_repo.get_by_id(case_id)

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "CASE_NOT_FOUND", "message": f"Recovery case {case_id} not found."},
        )

    if case.state in ("RECOVERED", "STOPPED", "ESCALATED"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "CASE_TERMINAL", "message": f"Cannot execute recovery for terminal case state '{case.state}'."},
        )

    return {
        "status": "execution_queued",
        "case_id": case_id,
        "state": case.state,
        "message": f"Policy-approved recovery execution queued for case {case_id}.",
    }


@api_v1_router.get("/recovery/cases/{case_id}/executions")
def get_case_executions(
    case_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Read-only endpoint returning execution history for a case."""
    execution_repo = PostgresRecoveryExecutionRepository(db)
    records = execution_repo.list_for_case(case_id)

    executions = []
    for rec in records:
        executions.append({
            "execution_id": rec.execution_id,
            "action_type": rec.action_type,
            "status": rec.status,
            "provider": rec.provider,
            "provider_reference": rec.provider_reference,
            "idempotency_key": rec.idempotency_key,
            "created_at": rec.created_at.isoformat() if rec.created_at else None,
            "completed_at": rec.completed_at.isoformat() if rec.completed_at else None,
        })

    return {
        "case_id": case_id,
        "execution_count": len(executions),
        "executions": executions,
    }


@api_v1_router.get("/recovery/jobs/{job_id}")
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Read-only endpoint returning recovery job status."""
    job_repo = PostgresRecoveryJobRepository(db)
    job = job_repo.get_by_id(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "JOB_NOT_FOUND", "message": f"Recovery job {job_id} not found."},
        )

    return {
        "job_id": job.job_id,
        "case_id": job.case_id,
        "trigger_id": job.trigger_id,
        "status": job.status,
        "attempt_number": job.attempt_number,
        "max_attempts": job.max_attempts,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "last_error": job.last_error,
        "correlation_id": job.correlation_id,
    }


@api_v1_router.get("/recovery/cases/{case_id}/status")
def get_consolidated_case_status(
    case_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Consolidated read-only status overview endpoint for a recovery case."""
    case_repo = PostgresRecoveryCaseRepository(db)
    execution_repo = PostgresRecoveryExecutionRepository(db)
    job_repo = PostgresRecoveryJobRepository(db)
    audit_repo = PostgresAuditRepository(db)

    case = case_repo.get_by_id(case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "CASE_NOT_FOUND", "message": f"Recovery case {case_id} not found."},
        )

    executions = execution_repo.list_for_case(case_id)
    jobs = job_repo.list_for_case(case_id)
    audit_events = audit_repo.get_timeline_for_case(case_id)

    latest_execution = executions[-1] if executions else None
    latest_job = jobs[-1] if jobs else None

    return {
        "case_id": case.id,
        "payment_id": case.payment_id,
        "customer_id": case.customer_id,
        "state": case.state,
        "priority": case.priority,
        "attempt_count": case.attempt_count,
        "terminal_reason": case.terminal_reason,
        "latest_execution": {
            "execution_id": latest_execution.execution_id,
            "action_type": latest_execution.action_type,
            "status": latest_execution.status,
            "provider": latest_execution.provider,
            "provider_reference": latest_execution.provider_reference,
        } if latest_execution else None,
        "latest_job": {
            "job_id": latest_job.job_id,
            "status": latest_job.status,
            "attempt_number": latest_job.attempt_number,
        } if latest_job else None,
        "audit_event_count": len(audit_events),
    }


# ============================================================
# Phase 2B Operational Provider APIs
# ============================================================

from app.execution.lifecycle import lifecycle_manager, ProviderLifecycleState
from app.execution.capabilities import capability_registry
from app.execution.provider_config import ProviderConfig
from app.execution.circuit_breaker import CircuitBreaker
from app.repository.postgres import PostgresProviderOperationRepository


@api_v1_router.get(
    "/operations/providers/health",
    dependencies=[Depends(verify_operations_read)],
)
def get_providers_health() -> Dict[str, Any]:
    """Returns real-time provider health and lifecycle statuses."""
    providers = lifecycle_manager.list_providers()
    return {
        "status": "ok",
        "providers": [p.to_dict() for p in providers],
    }


@api_v1_router.get(
    "/operations/providers/capabilities",
    dependencies=[Depends(verify_operations_read)],
)
def get_providers_capabilities() -> Dict[str, Any]:
    """Returns provider capability registry information."""
    providers = lifecycle_manager.list_providers()
    caps_map = {}
    for p in providers:
        caps_map[p.provider_name] = [c.value for c in p.capabilities]
    return {
        "status": "ok",
        "capabilities": caps_map,
    }


@api_v1_router.get(
    "/operations/providers/config",
    dependencies=[Depends(verify_operations_read)],
)
def get_providers_config() -> Dict[str, Any]:
    """Returns safe provider configuration status WITHOUT exposing secrets."""
    config = ProviderConfig()
    return {
        "status": "ok",
        "provider_config": config.safe_status(),
    }


@api_v1_router.get(
    "/operations/providers/circuit",
    dependencies=[Depends(verify_operations_read)],
)
def get_providers_circuit() -> Dict[str, Any]:
    """Returns circuit breaker state for active providers."""
    cb = CircuitBreaker()
    return {
        "status": "ok",
        "circuit_state": cb.state.value,
    }


@api_v1_router.get(
    "/operations/providers/metrics",
    dependencies=[Depends(verify_operations_read)],
)
def get_providers_metrics() -> Dict[str, Any]:
    """Returns provider operational metrics snapshot."""
    snapshot = telemetry_registry.snapshot()
    provider_counters = {
        k: v for k, v in snapshot.get("counters", {}).items() if "provider" in k.lower()
    }
    return {
        "status": "ok",
        "metrics": provider_counters,
    }


@api_v1_router.get(
    "/operations/providers/failures",
    dependencies=[Depends(verify_operations_read)],
)
def get_providers_failures(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns recent provider failures."""
    ops_repo = PostgresProviderOperationRepository(db)
    ops = ops_repo.list_recent(limit=50)
    failures = [
        {
            "id": op.id,
            "execution_id": op.execution_id,
            "provider_name": op.provider_name,
            "provider_operation": op.provider_operation,
            "normalized_status": op.normalized_status,
            "failure_code": op.failure_code,
            "failure_category": op.failure_category,
            "created_at": op.created_at.isoformat() if op.created_at else None,
        }
        for op in ops
        if op.normalized_status in ("FAILED", "REJECTED", "UNSUPPORTED")
    ]
    return {
        "status": "ok",
        "count": len(failures),
        "failures": failures,
    }


@api_v1_router.get(
    "/operations/providers/operations",
    dependencies=[Depends(verify_operations_read)],
)
def get_providers_operations(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Returns recent provider operation audit trail."""
    ops_repo = PostgresProviderOperationRepository(db)
    ops = ops_repo.list_recent(limit=limit)
    return {
        "status": "ok",
        "count": len(ops),
        "operations": [
            {
                "id": op.id,
                "execution_id": op.execution_id,
                "provider_name": op.provider_name,
                "provider_operation": op.provider_operation,
                "provider_reference_id": op.provider_reference_id,
                "normalized_status": op.normalized_status,
                "idempotency_key": op.idempotency_key,
                "correlation_id": op.correlation_id,
                "created_at": op.created_at.isoformat() if op.created_at else None,
            }
            for op in ops
        ],
    }


@api_v1_router.get(
    "/operations/providers/reconciliation",
    dependencies=[Depends(verify_operations_read)],
)
def get_providers_reconciliation(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns summary of provider reconciliation statuses."""
    ops_repo = PostgresProviderOperationRepository(db)
    ops = ops_repo.list_recent(limit=100)
    pending_count = sum(1 for op in ops if op.normalized_status in ("PENDING", "ACCEPTED", "PROCESSING"))
    failed_count = sum(1 for op in ops if op.normalized_status in ("FAILED", "REJECTED"))
    completed_count = sum(1 for op in ops if op.normalized_status == "SUCCESS")

    return {
        "status": "ok",
        "reconciliation": {
            "pending_count": pending_count,
            "failed_count": failed_count,
            "completed_count": completed_count,
            "total_recent_operations": len(ops),
        },
    }

