# Phase 1K — Distributed Worker Orchestration, Event-Driven Recovery & Production Reliability Architecture

## System Overview

RecoverFlow Phase 1K evolves the Phase 1J persistent recovery job queue into a **production-oriented distributed worker coordination platform**. The architecture supports concurrent workers, worker identity registration, heartbeat liveness tracking, stale worker detection, graceful draining, transactional atomic job claiming (`FOR UPDATE SKIP LOCKED`), priority-aware scheduling with age-based anti-starvation boost, backpressure queue protection, duplicate job suppression, in-process domain event bus fan-out, and event consumer idempotency protection.

---

## Architectural Principles & Invariants Enforced

> 1. **AI HAS ZERO FINANCIAL EXECUTION AUTHORITY**: The AI Agent is advisory only; it diagnoses root causes and recommends interventions. Workers delegate execution exclusively through the deterministic pipeline (`RecoveryLoopService` -> `DeterministicPolicyEngine` -> `RecoveryOrchestrator`).
> 2. **NO REAL FINANCIAL EXECUTION**: All financial executions are 100% simulated via `SimulatedExecutionProvider`.
> 3. **DATABASE IS THE SOURCE OF TRUTH**: Worker in-memory state is transient. Persistent job state, worker identity, leases, attempt counts, idempotency keys, and execution records are PostgreSQL authoritative.
> 4. **AT-LEAST-ONCE DELIVERY IS SAFE**: Duplicate jobs or domain events are handled idempotently via `idempotency_key` and `(event_id, consumer_name)` unique constraints.
> 5. **OPERATIONAL PAUSE & CIRCUIT BREAKER RESPECT**: Workers inspect `RecoveryOperationsController` PAUSED status and `CircuitBreaker` OPEN status prior to executing financial recovery attempts.

---

## Key Subsystems

### 1. Worker Identity & Registry (`backend/app/workers/`)
- **`WorkerIdentity`**: Dataclass capturing `worker_id`, `hostname`, `process_id`, `started_at`, `last_heartbeat_at`, `status` (`STARTING`, `RUNNING`, `DRAINING`, `STOPPED`, `LOST`), `capabilities`, and `version`.
- **`WorkerRegistry`**: SQL repository performing worker registration (`WorkerModel`), periodic heartbeats, graceful draining status transitions, and stale worker detection (`detect_stale_workers(timeout_seconds=30)`).
- **`WorkerFleetHealth`**: Aggregates total, active, running, draining, and lost worker counts for system health checks.

### 2. Distributed Job Claiming & Priority Scheduler (`backend/app/jobs/`)
- **Atomic Claiming**: `JobRepository.claim_next_available_job()` uses `FOR UPDATE SKIP LOCKED` in PostgreSQL and atomic row locks in SQLite.
- **`PriorityScheduler`**: Priority ranks (`CRITICAL`=4, `HIGH`=3, `NORMAL`=2, `LOW`=1) with age-based anti-starvation boost:
  $$\text{effective\_priority} = \text{base\_priority\_rank} + \lfloor \text{age\_seconds} \times 0.1 \rfloor$$

### 3. Backpressure & Duplicate Job Suppression (`backend/app/jobs/`)
- **`BackpressureController`**: Evaluates queue depth and assigns levels (`NORMAL`, `ELEVATED`, `HIGH`, `CRITICAL`). Rejects low-priority jobs when `HIGH` or `CRITICAL` without silently dropping jobs.
- **`JobDeduplicationService`**: Checks `idempotency_key` collisions, returns existing job records, emits `JOB_DEDUPLICATED` audit events, and updates `jobs.duplicate_suppressed` telemetry metrics.

### 4. Domain Event Bus & Consumer Idempotency (`backend/app/events/`)
- **`InMemoryEventBus` & `EventPublisher`**: Thread-safe in-process domain event bus supporting event types (`PAYMENT_FAILURE_RECEIVED`, `RECOVERY_JOB_CREATED`, `RECOVERY_JOB_COMPLETED`, `RECOVERY_JOB_FAILED`, `RECOVERY_RETRY_SCHEDULED`, `RECOVERY_CASE_RECOVERED`, `RECONCILIATION_COMPLETED`).
- **`EventConsumerIdempotencyService`**: Stores `EventProcessingRecordModel` records to guarantee `(event_id, consumer_name)` uniqueness and returns `ALREADY_PROCESSED` on duplicate event delivery.

### 5. Worker Concurrency & Failover (`backend/app/jobs/worker.py`)
- **`RecoveryWorker`**: Manages worker lifecycle (`start`, `drain`, `stop`), enforces `max_concurrent_jobs`, performs periodic heartbeats, sweeps expired worker leases, marks lost workers, and logs `WORKER_FAILOVER_COMPLETED` audit events.

### 6. Queue Reconciliation & Scheduled Maintenance (`backend/app/jobs/`)
- **`JobQueueReconciliationService`**: Inspects queue integrity, reclaims expired/lost worker leases, and cancels queued jobs referencing terminal recovery cases (`RECOVERED`, `STOPPED`, `ESCALATED`).
- **`MaintenanceService`**: Idempotent pass executing housekeeping tasks (`run_once()`).

---

## Operations REST API Endpoints (`/api/v1/operations/*`)

- `GET /operations/workers`: List registered worker nodes.
- `GET /operations/workers/{worker_id}`: Fetch worker identity details.
- `POST /operations/workers/{worker_id}/drain`: Initiate worker graceful draining.
- `GET /operations/queue/status`: View queue metrics and backpressure level.
- `GET /operations/queue/reconciliation`: Preview queue reconciliation metrics.
- `POST /operations/queue/reconcile`: Execute queue reconciliation pass.
- `GET /operations/events`: List recent domain event processing records.
- `GET /operations/backpressure`: View current backpressure level and recommended deferral delay.

---

## Future Message Broker Integration Boundary

Phase 1K enforces clean abstract boundaries (`EventPublisher`, `EventConsumer`, `JobRepository`, `WorkerRegistry`). While Phase 1K uses PostgreSQL and an in-process event bus to remain 100% self-contained and testable without external daemons, the interfaces are designed so external distributed message brokers (Kafka, RabbitMQ, Redis) can be plugged in seamlessly in Phase 2+.
