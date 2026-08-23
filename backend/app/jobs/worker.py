import os
import time
import json
import uuid
import logging
from typing import Optional, List
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.jobs.job import RecoveryJob, JobStatus, JobType
from app.repository.job_repository import JobRepository
from app.jobs.retry import RetryPolicy
from app.recovery.service import RecoveryLoopService, AutonomousRecoveryResult
from app.recovery.operations import RecoveryOperationsController
from app.execution.circuit_breaker import CircuitBreaker, CircuitState, ProviderCircuitOpenError
from app.domain.audit import AuditEventType
from app.domain.customer import CustomerContext
from app.domain.payment import Payment, PaymentStatus, FailureCode
from app.domain.recovery_case import RecoveryCase, CaseState, CasePriority
from app.repository.postgres import (
    PostgresAuditRepository,
    PostgresRecoveryCaseRepository,
    PostgresPaymentRepository,
    PostgresCustomerRepository,
)
from app.repository.models import AuditEventModel, RecoveryCaseModel
from app.workers.worker_identity import WorkerIdentity, WorkerStatus
from app.workers.worker_registry import WorkerRegistry
from app.observability.telemetry import telemetry_registry

logger = logging.getLogger("recoverflow.jobs.worker")


@dataclass
class WorkerConfig:
    worker_id: Optional[str] = None
    max_concurrent_jobs: int = 5
    poll_interval: float = 1.0
    heartbeat_interval: float = 5.0
    lease_duration: int = 60
    shutdown_timeout: float = 10.0


class RecoveryWorker:
    """Production-grade distributed recovery worker.

    Enforces concurrency limits, worker identity registration, periodic heartbeats,
    graceful draining, failover lease recovery, and policy-governed execution.
    """

    def __init__(
        self,
        worker_id: Optional[str] = None,
        config: Optional[WorkerConfig] = None,
        job_repository: Optional[JobRepository] = None,
        service: Optional[RecoveryLoopService] = None,
        retry_policy: Optional[RetryPolicy] = None,
        lease_seconds: int = 60,
    ) -> None:
        self.config = config or WorkerConfig(
            worker_id=worker_id,
            lease_duration=lease_seconds,
        )
        wid = worker_id or self.config.worker_id or f"worker_{uuid.uuid4().hex[:8]}"
        self.worker_id = wid
        self.identity = WorkerIdentity(worker_id=wid)
        self.repository = job_repository
        self.service = service or RecoveryLoopService()
        self.retry_policy = retry_policy or RetryPolicy()
        self.lease_seconds = self.config.lease_duration
        self.running = False
        self.active_jobs_count = 0
        self.operations_controller = RecoveryOperationsController()
        self.circuit_breaker = CircuitBreaker()

    def start(self, session: Optional[Session] = None) -> None:
        """Starts worker lifecycle, registers identity, and performs crash recovery sweep."""
        self.running = True
        self.identity.status = WorkerStatus.RUNNING
        logger.info("Worker %s starting...", self.worker_id)

        if session:
            registry = WorkerRegistry(session)
            registry.register_worker(self.identity)
            self.recover_expired_leases(session)

        telemetry_registry.increment("jobs.worker_started")

    def drain(self, session: Optional[Session] = None) -> None:
        """Initiates graceful draining: stops claiming new jobs while finishing active work."""
        logger.info("Worker %s entering DRAINING state...", self.worker_id)
        self.identity.status = WorkerStatus.DRAINING
        if session:
            registry = WorkerRegistry(session)
            registry.mark_draining(self.worker_id)

    def stop(self, session: Optional[Session] = None) -> None:
        """Gracefully stops worker lifecycle."""
        logger.info("Worker %s stopping gracefully...", self.worker_id)
        self.running = False
        self.identity.status = WorkerStatus.STOPPED
        if session:
            registry = WorkerRegistry(session)
            registry.mark_stopped(self.worker_id)
        telemetry_registry.increment("jobs.worker_stopped")

    def heartbeat(self, session: Session) -> bool:
        """Emits worker liveness heartbeat to registry."""
        registry = WorkerRegistry(session)
        self.identity.heartbeat()
        return registry.heartbeat_worker(self.worker_id)

    def recover_expired_leases(self, session: Session) -> List[RecoveryJob]:
        """Finds expired worker leases and lost worker jobs and safely requeues them."""
        repo = self.repository or JobRepository(session)
        registry = WorkerRegistry(session)

        # Detect stale lost workers first
        lost_workers = registry.detect_stale_workers(timeout_seconds=30.0)
        stale_jobs: List[RecoveryJob] = []
        for lost_w in lost_workers:
            stale_jobs.extend(repo.recover_jobs_owned_by_worker(lost_w.worker_id))

        # Sweep expired lease jobs
        expired_jobs = repo.recover_expired_jobs()
        recovered = stale_jobs + expired_jobs

        if recovered:
            audit_repo = PostgresAuditRepository(session)
            for job in recovered:
                audit_repo.save_event(
                    AuditEventModel(
                        id=f"aud_failover_{uuid.uuid4().hex[:12]}",
                        event_type=AuditEventType.WORKER_FAILOVER_COMPLETED.value if hasattr(AuditEventType, "WORKER_FAILOVER_COMPLETED") else AuditEventType.WORKER_CRASH_RECOVERY.value,
                        aggregate_id=job.job_id,
                        case_id=job.case_id,
                        payment_id=job.payment_id,
                        payload=json.dumps({
                            "recovering_worker_id": self.worker_id,
                            "recovered_job_id": job.job_id,
                            "previous_status": "EXPIRED_LEASE_OR_LOST_WORKER",
                        }),
                        timestamp=datetime.now(timezone.utc),
                        correlation_id=job.correlation_id,
                    )
                )
                telemetry_registry.increment("jobs.worker_recovered")
                telemetry_registry.increment("jobs.lease_expired")

            session.commit()
            logger.info("Worker %s recovered %d expired/lost job leases", self.worker_id, len(recovered))

        return recovered

    def process_next_job(self, session: Session) -> Optional[AutonomousRecoveryResult]:
        """Atomically claims and processes the next eligible recovery job from queue."""
        # Update heartbeat
        self.heartbeat(session)

        # Check concurrency & draining status
        if not self.identity.is_active or self.identity.status == WorkerStatus.DRAINING:
            logger.debug("Worker %s is not active or draining. Claim skipped.", self.worker_id)
            return None

        if self.active_jobs_count >= self.config.max_concurrent_jobs:
            logger.warning("Worker %s reached max concurrent jobs limit (%d). Claim skipped.", self.worker_id, self.config.max_concurrent_jobs)
            return None

        repo = self.repository or JobRepository(session)
        job = repo.claim_job(self.worker_id, lease_seconds=self.lease_seconds)

        if not job:
            return None

        self.active_jobs_count += 1
        corr_id = job.correlation_id or f"corr_{uuid.uuid4().hex[:12]}"

        try:
            # Audit Claimed
            audit_repo = PostgresAuditRepository(session)
            audit_repo.save_event(
                AuditEventModel(
                    id=f"aud_{uuid.uuid4().hex[:12]}",
                    event_type=AuditEventType.JOB_CLAIMED.value,
                    aggregate_id=job.job_id,
                    case_id=job.case_id,
                    payment_id=job.payment_id,
                    payload=json.dumps({
                        "worker_id": self.worker_id,
                        "attempt_number": job.attempt_count,
                        "lease_expires_at": job.lease_expires_at.isoformat() if job.lease_expires_at else None,
                    }),
                    timestamp=datetime.now(timezone.utc),
                    correlation_id=corr_id,
                )
            )
            session.commit()
            telemetry_registry.increment("jobs.claimed")

            # 1. Operational Pause Check
            ops_status = self.operations_controller.status
            if ops_status.value == "PAUSED":
                logger.warning("Recovery operations are PAUSED. Job %s postponed.", job.job_id)
                repo.schedule_retry(
                    job.job_id,
                    retry_at=datetime.now(timezone.utc) + timedelta(seconds=10),
                    error_message="Recovery operations PAUSED",
                    error_code="RECOVERY_PAUSED",
                )
                telemetry_registry.increment("jobs.paused")
                return None

            # 2. Terminal Case Check
            case_repo = PostgresRecoveryCaseRepository(session)
            case_model = case_repo.get_by_id(job.case_id)
            if case_model and case_model.state in ("RECOVERED", "STOPPED", "ESCALATED"):
                logger.info("Case %s is in terminal state %s. Cancelling job %s.", job.case_id, case_model.state, job.job_id)
                repo.cancel_job(job.job_id, reason=f"Terminal case state: {case_model.state}")
                telemetry_registry.increment("jobs.cancelled")
                return None

            # 3. Circuit Breaker Check
            if self.circuit_breaker.state == CircuitState.OPEN:
                logger.warning("Circuit breaker is OPEN. Job %s blocked from provider execution.", job.job_id)
                should_retry, next_time = self.retry_policy.should_retry(job, error_code="CIRCUIT_OPEN")
                if should_retry and next_time:
                    repo.schedule_retry(job.job_id, retry_at=next_time, error_message="Circuit breaker OPEN", error_code="CIRCUIT_OPEN")
                else:
                    repo.dead_letter_job(job.job_id, error_message="Circuit breaker OPEN and retry exhausted")

                audit_repo.save_event(
                    AuditEventModel(
                        id=f"aud_{uuid.uuid4().hex[:12]}",
                        event_type=AuditEventType.PROVIDER_CIRCUIT_BLOCKED.value,
                        aggregate_id=job.job_id,
                        case_id=job.case_id,
                        payment_id=job.payment_id,
                        payload=json.dumps({"circuit_state": "OPEN"}),
                        timestamp=datetime.now(timezone.utc),
                        correlation_id=corr_id,
                    )
                )
                session.commit()
                telemetry_registry.increment("jobs.circuit_blocked")
                return None

            # 4. Execute Autonomous Recovery through RecoveryLoopService
            start_time = time.time()
            payment_repo = PostgresPaymentRepository(session)
            customer_repo = PostgresCustomerRepository(session)

            payment_model = payment_repo.get_by_id(job.payment_id)
            if not payment_model:
                raise ValueError(f"Payment {job.payment_id} not found in database.")

            customer_model = customer_repo.get_by_id(case_model.customer_id)
            if not customer_model:
                raise ValueError(f"Customer {case_model.customer_id} not found in database.")

            domain_customer = CustomerContext(
                customer_id=customer_model.id,
                historical_success_count=customer_model.successful_payments,
                historical_failure_count=customer_model.failed_payments,
                average_payment_delay_hours=customer_model.average_payment_delay,
                previous_recovery_success_rate=customer_model.recovery_success_rate,
                customer_segment=customer_model.segment,
                total_spent=customer_model.total_spent,
            )

            failure_code_enum = FailureCode(payment_model.failure_code) if payment_model.failure_code else None
            domain_payment = Payment(
                payment_id=payment_model.id,
                customer_id=payment_model.customer_id,
                amount=payment_model.amount,
                currency=payment_model.currency,
                status=PaymentStatus(payment_model.status) if payment_model.status in PaymentStatus.__members__ else PaymentStatus.FAILED,
                failure_code=failure_code_enum,
            )

            domain_case = RecoveryCase(
                case_id=case_model.id,
                payment_id=case_model.payment_id,
                customer_id=case_model.customer_id,
                amount_at_risk=payment_model.amount,
                state=CaseState(case_model.state) if case_model.state in CaseState.__members__ else CaseState.DETECTED,
                priority=CasePriority(case_model.priority) if case_model.priority in CasePriority.__members__ else CasePriority.MEDIUM,
                attempts_count=case_model.attempt_count,
                max_allowed_attempts=case_model.max_allowed_attempts,
            )

            result = self.service.run_autonomous_recovery(
                case=domain_case,
                payment=domain_payment,
                customer=domain_customer,
            )
            duration_ms = (time.time() - start_time) * 1000.0
            telemetry_registry.histogram("jobs.processing_duration", duration_ms)

            # Sync domain case state back to DB model
            case_model.state = domain_case.state.value
            case_model.attempt_count = domain_case.attempts_count
            if result and result.stop_reason:
                case_model.terminal_reason = result.stop_reason
            session.merge(case_model)

            if result and (result.is_recovered or domain_case.state == CaseState.RECOVERED):
                repo.complete_job(job.job_id, correlation_id=corr_id)
                audit_repo.save_event(
                    AuditEventModel(
                        id=f"aud_{uuid.uuid4().hex[:12]}",
                        event_type=AuditEventType.JOB_SUCCEEDED.value,
                        aggregate_id=job.job_id,
                        case_id=job.case_id,
                        payment_id=job.payment_id,
                        payload=json.dumps({"execution_status": "SUCCEEDED", "duration_ms": duration_ms}),
                        timestamp=datetime.now(timezone.utc),
                        correlation_id=corr_id,
                    )
                )
                session.commit()
                telemetry_registry.increment("jobs.succeeded")
                return result
            else:
                err_msg = result.stop_reason if result else "Execution returned unsuccessful result"
                self._handle_job_failure(repo, session, job, err_msg, corr_id)
                return result

        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000.0
            logger.error("Error executing job %s: %s", job.job_id, str(exc), exc_info=True)
            self._handle_job_failure(repo, session, job, str(exc), corr_id)
            return None
        finally:
            self.active_jobs_count = max(0, self.active_jobs_count - 1)

    def _handle_job_failure(
        self,
        repo: JobRepository,
        session: Session,
        job: RecoveryJob,
        error_message: str,
        correlation_id: str,
    ) -> None:
        should_retry, next_time = self.retry_policy.should_retry(job, error_code="EXECUTION_FAILURE")
        audit_repo = PostgresAuditRepository(session)

        if should_retry and next_time:
            repo.schedule_retry(job.job_id, retry_at=next_time, error_message=error_message)
            audit_repo.save_event(
                AuditEventModel(
                    id=f"aud_{uuid.uuid4().hex[:12]}",
                    event_type=AuditEventType.JOB_RETRY_SCHEDULED.value,
                    aggregate_id=job.job_id,
                    case_id=job.case_id,
                    payment_id=job.payment_id,
                    payload=json.dumps({"attempt_count": job.attempt_count + 1, "next_available_at": next_time.isoformat(), "error": error_message}),
                    timestamp=datetime.now(timezone.utc),
                    correlation_id=correlation_id,
                )
            )
            telemetry_registry.increment("jobs.retry_scheduled")
        else:
            repo.dead_letter_job(job.job_id, error_message=error_message)
            audit_repo.save_event(
                AuditEventModel(
                    id=f"aud_{uuid.uuid4().hex[:12]}",
                    event_type=AuditEventType.JOB_DEAD_LETTERED.value,
                    aggregate_id=job.job_id,
                    case_id=job.case_id,
                    payment_id=job.payment_id,
                    payload=json.dumps({"max_attempts": job.max_attempts, "final_error": error_message}),
                    timestamp=datetime.now(timezone.utc),
                    correlation_id=correlation_id,
                )
            )
            telemetry_registry.increment("jobs.dead_lettered")

        session.commit()
