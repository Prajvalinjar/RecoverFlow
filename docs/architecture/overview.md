# RecoverFlow Architecture Overview

**Challenge:** Razorpay Buildathon — Track 03: AI Revenue Recovery  
**Product:** RecoverFlow  
**Service:** `recoverflow-api`

---

## 1. System Vision & Core Principles

> **System Statement:** RecoverFlow is an autonomous revenue recovery system designed to analyze payment failures, determine root causes, execute bounded recovery workflows, and verify recovered revenue with complete auditability.
> 
> **Core Architectural Principle:** RecoverFlow is **NOT** an AI chatbot, LLM wrapper, or n8n workflow. The AI Agent is a reasoning component inside a bounded financial system. **AI recommendations never directly authorize financial execution.**

---

## 2. Four Distinct Architectural Layers

RecoverFlow enforces a clear, four-tier separation of concerns across the recovery lifecycle:

1. **RECOVERY INTELLIGENCE**: Transforms payment failure codes, customer context, and recovery attempt history into structured, explainable evidence signals and a `RecoveryOpportunity`. Answers why the payment failed, whether recovery is worthwhile, what risks exist, and whether action is currently actionable or on cooldown.
2. **AI REASONING**: Consumes the `RecoveryOpportunity` and contextual reasoning inputs to diagnose root causes, generate candidate interventions, evaluate candidates, and output a structured `AgentDecision` (recommendation, confidence, rationale).
3. **DETERMINISTIC POLICY**: Evaluates `PolicyEvaluationContext` against deterministic business safety rules (retry limits, cooldown periods, monetary thresholds, terminal state checks, stopping rules) to produce a `PolicyDecision`.
4. **EXECUTION**: `RecoveryOrchestrator` acts as the mandatory execution authority gatekeeper. Accepts **ONLY** approved policy decisions (`allowed == True`) and generates `RecoveryExecution` with a mandatory `idempotency_key`.

> *"Recovery Intelligence explains whether a failed payment appears recoverable. AI reasoning selects and recommends a candidate intervention. Deterministic policy decides whether the recommended intervention is allowed. Execution occurs only after policy approval."*

---

## 3. End-to-End System Architecture

```
                 [ Payment Failure + Customer Context ]
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │    1. RECOVERY INTELLIGENCE  │
                     │  • Failure Classification    │
                     │  • Signal Extraction         │
                     │  • Recoverability Scoring    │
                     │  • Actionability & Urgency   │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                         [ RecoveryOpportunity ]
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │       2. AI REASONING        │  ◄── AI CONTROLLED
                     │  • Context Understanding     │      (Advisory Only)
                     │  • Root-Cause Diagnosis      │
                     │  • Candidate Interventions   │
                     │  • Recommendation Rationale  │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                            [ AgentDecision ]
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │    3. DETERMINISTIC POLICY   │  ◄── DETERMINISTIC CONTROLLED
                     │  • Mandatory Safety Gate     │      (Final Authority)
                     │  • Financial Risk Limits     │
                     │  • Retry Count Limits        │
                     │  • Cooldown Period Rules     │
                     │  • Terminal State Checks     │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                            [ PolicyDecision ]
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │         4. EXECUTION         │
                     │  • RecoveryOrchestrator      │
                     │  • Authorized Execution Gate │
                     │  • Idempotency Guarantee     │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                        [ RecoveryExecution ]
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │ 5. SIMULATED EXECUTION LAYER │  ◄── SIMULATED ENVIRONMENT
                     │  • SimulatedRecoveryExecutor │      (Zero real payment calls)
                     │  • In-Memory Registry        │
                     │  • Context-Aware Outcomes    │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                          [ RecoveryOutcome ]
                                    │
                                    ▼
                          [ CaseEvaluation ]
                                    │
                                    ▼
                        [ Immutable Audit Trail ]
                                    │
                                    ▼
                      [ Updated Recovery Context ]
                                    │
                                    └───► [ Next Bounded Cycle OR STOP ]
```

---

## 4. Phase 1C Autonomous Recovery Loop & Simulated Execution

### Key Components

1. **SimulatedRecoveryExecutor (`backend/app/simulation/`)**:
   - Strongly typed simulated execution engine responsible solely for simulating outcomes of already policy-approved `RecoveryExecution` contracts.
   - Enforces 100% deterministic, zero-randomness simulation based on action type, failure code, attempt count, customer segment, and scenario rules.
   - Zero real payment infrastructure integration; exists solely to validate autonomous recovery architecture safely.

2. **Autonomous Recovery Loop Service (`backend/app/recovery/`)**:
   - `RecoveryLoopService`: Coordinates end-to-end multi-step recovery journeys (`RecoveryOpportunityDetector` → `PrototypeRecoveryAgent` → `DeterministicPolicyEngine` → `RecoveryOrchestrator` → `SimulatedRecoveryExecutor` → Outcome & Evaluation → Audit Trail).
   - Enforces bounded multi-step recovery via `run_autonomous_recovery(..., max_cycles=3)` to prevent infinite execution loops.
   - Handles explicit stopping conditions: payment recovery, terminal case state (`RECOVERED`, `ESCALATED`, `STOPPED`), cooldown wait (`WAIT`), policy rejection, or `max_cycles`.

3. **Idempotency Guarantee**:
   - Every `RecoveryExecution` generated by `RecoveryOrchestrator` contains a deterministic `idempotency_key`.
   - `SimulatedRecoveryExecutor` maintains an in-memory execution registry preventing duplicate execution of the same key. Duplicate executions return cached outcomes without creating a secondary simulated financial event.

4. **Safety Boundaries & Invariants**:
   - **AI recommendations NEVER directly authorize financial execution.**
   - `RecoveryOpportunity` and `AgentDecision` inputs submitted directly to `RecoveryOrchestrator` or `SimulatedRecoveryExecutor` raise `PolicyApprovalRequiredError`.
   - Only `PolicyDecision` instances with `allowed == True` can be dispatched into `RecoveryExecution`.

---

## 5. Phase 1D Recovery Data, Historical Intelligence & Benchmarking

### Key Components

1. **Synthetic Data Subsystem (`backend/app/data/`)**:
   - `SyntheticDataGenerator`: Generates realistic, coherent fintech customer populations and payment histories using an isolated RNG (`random.Random(seed)`). Guarantees 100% reproducible data generation without mutating Python's global random state.
   - `SyntheticDataset`: Container for `SyntheticCustomer`, `SyntheticPayment`, `SyntheticRecoveryCase`, `SyntheticRecoveryAttempt`. Enforces relational and domain validation rules (`recovered_cases <= total_cases`, `historical_success_rate` within `[0.0, 1.0]`).
   - `BenchmarkScenarioLibrary`: Pre-packaged canonical benchmark scenarios (Scenarios A through H) covering high recoverability, multi-step retries, poor history, retry exhaustion, high value risk, cooldown, terminal states, and new customer uncertainty.
   - `InMemoryRecoveryRepository`: In-memory storage abstraction laying the CRUD foundation for future database integration.

2. **Benchmarking Subsystem (`backend/app/benchmark/`)**:
   - `BaselineStrategy`: Abstract interface implemented by:
     - `NoRecoveryBaseline`: Zero interventions, ₹0 recovered revenue.
     - `BlindRetryBaseline`: Naive single retry attempt without context or adaptation.
     - `RepeatedRetryBaseline`: Repeated retry up to 3 times without adaptive reasoning.
     - `RecoverFlowStrategy`: Invokes the **actual existing** `RecoveryLoopService.run_autonomous_recovery(...)` pipeline.
   - `BenchmarkRunner`: Runs all 4 strategies against a synthetic dataset with complete state isolation between strategies.
   - `BenchmarkMetrics` & `BenchmarkReport`: Computes validated comparative metrics (recovery rate, revenue percentage, average attempts, policy rejections, stopped cases) and formats reports with empirical observations.

```
                     [ Synthetic Dataset ]
                               │
                               ▼
                    [ BenchmarkRunner ]
                               │
         ┌─────────────────────┼─────────────────────┬─────────────────────┐
         │                     │                     │                     │
         ▼                     ▼                     ▼                     ▼
  [ No Recovery ]       [ Blind Retry ]      [ Repeated Retry ]     [ RecoverFlow Strategy ]
  (Baseline 1)          (Baseline 2)          (Baseline 3)           (Real Recovery Pipeline)
         │                     │                     │                     │
         └─────────────────────┴─────────────────────┴─────────────────────┘
                               │
                               ▼
                      [ BenchmarkMetrics ]
                               │
                               ▼
                      [ BenchmarkReport ]
```

3. **Engineering Disclaimers & Limitations**:
   - Benchmarking evaluates system decision behavior deterministically; it does NOT grant financial execution authority.
   - Synthetic benchmark results represent engineering validation evidence, not real-world production performance claims.

---

## 6. Phase 1F Payment Event Ingestion, Persistent Recovery State & Production API Boundary

### Key Components

1. **PostgreSQL & Repository Persistence (`backend/app/database/`, `backend/app/repository/`)**:
   - `Base`, `create_db_engine`, `SessionLocal`, `get_db`: SQLAlchemy database connection & session lifecycle management supporting PostgreSQL with SQLite fallback for isolated test suites.
   - ORM Models (`models.py`): `CustomerModel`, `PaymentModel`, `RecoveryCaseModel`, `RecoveryAttemptModel`, `PaymentEventModel` (`UNIQUE(provider_event_id)` constraint), `AuditEventModel`.
   - Repository Interfaces (`interfaces.py`) & PostgreSQL Implementation (`postgres.py`): Decouples domain logic from database ORM details.
   - Alembic Migrations (`alembic.ini`, `migrations/`): Schema migration foundation.

2. **Idempotent Webhook Event Ingestion (`backend/app/events/`, `backend/app/api/schemas/`)**:
   - `PaymentFailureEvent`: Pydantic schema enforcing strict validation (`event_id`, `payment_id`, `customer_id`, `amount > 0`, `currency`, `failure_code`).
   - `PaymentEventProcessor`: Deduplicates events using application-level checks + database UNIQUE constraint handling `IntegrityError` safely. Atomically persists customer, payment, recovery case, and `CASE_DETECTED` audit logs.
   - `EventAuthenticator`: Interface supporting development secret validation (`X-Event-Secret`) and extensible Razorpay signature verification (`X-Razorpay-Signature`).

3. **Background Recovery Trigger & Execution Provider (`backend/app/recovery/`, `backend/app/execution/`)**:
   - `RecoveryTrigger` & `RecoveryJobDispatcher`: Triggers autonomous recovery post-commit safely, passing case context to `RecoveryLoopService`.
   - `SimulatedRecoveryExecutionProvider`: Wraps `SimulatedRecoveryExecutor`, ensuring Phase 1F execution remains 100% simulated without calling real Razorpay financial APIs.

```text
               PAYMENT FAILURE EVENT (Webhook)
                              │
                              ▼
                   [ POST /api/v1/events/payment-failure ]
                              │
                              ▼
                   [ EventAuthenticator ] (Header Validation)
                              │
                              ▼
                   [ PaymentEventProcessor ]
                              │
       ┌──────────────────────┴──────────────────────┐
       ▼                                             ▼
[ PostgreSQL Repository ]                   [ RecoveryJobDispatcher ] (Background)
• PaymentEvent (UNIQUE provider_event_id)           │
• Payment & Customer                                 ▼
• RecoveryCase                               [ RecoveryTrigger ]
• RecoveryAttempt                                    │
• AuditEvent                                         ▼
                                            [ RecoveryLoopService ] (Phase 1C)
                                                     │
                                                     ▼
                                            [ SimulatedRecoveryExecutor ]
```

### Security & Invariant Verification
> - **AI recommendations NEVER directly authorize financial execution.**
> - **Database persistence does NOT grant execution authority.**
> - **Webhook ingestion is an event boundary, NOT an execution boundary.**

---

## 7. Phase 1G Production Recovery Execution Provider, Webhook Reliability & Operational Resilience

### Key Components

1. **Provider-Agnostic Execution Architecture (`backend/app/execution/`)**:
   - `ExecutionResult`: Provider-agnostic execution status contract (`ACCEPTED`, `PROCESSING`, `COMPLETED`, `FAILED`, `REJECTED`, `UNKNOWN`).
   - `RecoveryExecutionProvider`: Abstract provider interface exposing `execute_action`, `get_status`, `supports`, `provider_name`.
   - `SimulatedExecutionProvider`: Wraps `SimulatedRecoveryExecutor` using composition, providing deterministic execution results.
   - `ExecutionProviderRouter`: Resolves provider based on action type. Enforces strict input authorization; accepts ONLY approved `RecoveryExecution` instances. Rejects direct `AgentDecision` or `RecoveryOpportunity` inputs with `PolicyApprovalRequiredError`.

2. **Durable Job Tracking & Exponential Backoff Retry Policy (`backend/app/recovery/`)**:
   - `RecoveryJob` & `RecoveryJobModel`: Persistent recovery job lifecycle model (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `RETRY_SCHEDULED`, `DEAD_LETTERED`, `CANCELLED`).
   - `RecoveryRetryPolicy`: Deterministic exponential backoff policy (5s, 15s, 45s) capping retry attempts at 3. Non-retryable failure categories (`PERMANENT_PROVIDER_FAILURE`, `VALIDATION_FAILURE`, `AUTHORIZATION_FAILURE`) stop retries immediately.
   - `RecoveryReconciliationService`: Reconciles provider `ExecutionResult` into `RecoveryOutcome` and updates `RecoveryCase` state without treating `UNKNOWN`/`PROCESSING` as recovered.

3. **Telemetry Metrics & Endpoints (`backend/app/observability/`, `backend/app/api/v1/`)**:
   - `MetricsRegistry`: In-memory operational metrics counter and gauge tracking (`payment_events_received`, `recovery_jobs_created`, `executions_dispatched`, `recoveries_completed`, etc.).
   - REST Endpoints:
     - `POST /api/v1/recovery/cases/{case_id}/execute`: Triggers execution for approved cases.
     - `GET /api/v1/recovery/cases/{case_id}/executions`: Execution history.
     - `GET /api/v1/recovery/jobs/{job_id}`: Job status.
     - `GET /api/v1/recovery/cases/{case_id}/status`: Consolidated status overview.
     - `GET /api/v1/metrics`: Operational telemetry metrics.

```text
               PAYMENT FAILURE EVENT (Webhook)
                              │
                              ▼
                   [ POST /api/v1/events/payment-failure ]
                              │
                              ▼
                   [ EventAuthenticator ] (Header Validation)
                              │
                              ▼
                   [ PaymentEventProcessor ]
                              │
       ┌──────────────────────┴──────────────────────┐
       ▼                                             ▼
[ PostgreSQL Repository ]                   [ RecoveryJobDispatcher ] (Durable Job)
• PaymentEvent (UNIQUE provider_event_id)           │
• Payment & Customer                                 ▼
• RecoveryCase & RecoveryJob                [ RecoveryLoopService ] (Phase 1C)
• RecoveryExecution & AuditEvent                     │
                                                     ▼
                                            [ ExecutionProviderRouter ]
                                                     │
                                                     ▼
                                            [ SimulatedExecutionProvider ]
                                                     │
                                                     ▼
                                            [ RecoveryReconciliationService ]
```

### Security & Invariant Verification
> - **RecoverFlow treats execution providers as downstream adapters. Provider execution NEVER grants financial authorization.**
> - **AI recommendations NEVER directly authorize or execute financial actions.**
> - **All financial execution remains downstream of deterministic policy approval.**

---

## 8. Phase 1H Production Observability, Reliability Controls & Recovery Operations Platform

### Key Components

1. **Observability Subsystem (`backend/app/observability/`)**:
   - `HealthCheckService` (`health.py`): Side-effect free health inspection service checking database connectivity, repository health, execution provider status, job dispatcher system, and reconciliation status. Overall status (`HEALTHY`, `DEGRADED`, `UNHEALTHY`) derived deterministically from component states.
   - `TelemetryRegistry` (`telemetry.py`): In-memory, thread-safe counter, gauge, and histogram metric registry with snapshotting and test resets.
   - `RecoveryMetricsService` (`recovery_metrics.py`): Aggregates domain-level operational metrics using repository abstractions without ORM model coupling.

2. **Provider Reliability & Circuit Breaker (`backend/app/execution/`)**:
   - `ProviderHealthMonitor` (`provider_health.py`): Deterministic provider health classification (`HEALTHY`, `DEGRADED`, `UNAVAILABLE`, `UNKNOWN`) based on consecutive failures and successes.
   - `CircuitBreaker` (`circuit_breaker.py`): Time-controllable circuit breaker state machine (`CLOSED`, `OPEN`, `HALF_OPEN`). Raises `ProviderCircuitOpenError` when execution is attempted while `OPEN`.

3. **Recovery Operations Controls & Job Management (`backend/app/recovery/`)**:
   - `RecoveryOperationsController` (`operations.py`): Manages global processing state (`RUNNING`, `PAUSED`, `DRAINING`, `STOPPED`). Pausing blocks new job executions without modifying completed executions or historical outcomes. State changes emit audit logs.
   - `RecoveryJobOperationsService` (`job_operations.py`): Supports job inspection, manual retries under attempt limits, job cancellation, and dead-letter requeuing.
   - Extended `RecoveryReconciliationService` (`reconciliation.py`): Integrates `ReconciliationStatus` (`NOT_REQUIRED`, `PENDING`, `IN_PROGRESS`, `RECONCILED`, `FAILED`, `MANUAL_REVIEW`). `UNKNOWN` provider state transitions to `MANUAL_REVIEW` or `PENDING` and is NEVER automatically marked `RECOVERED`.

4. **Security & Operations REST API Boundary (`backend/app/security/`, `backend/app/api/v1/`)**:
   - `OperationsAuthenticator` (`operations_auth.py`): Header-based RBAC authentication (`X-Operations-Key`, `X-Operations-Role`). Enforces `VIEWER` (read-only), `OPERATOR` (read + pause/resume + job retry/cancel), and `ADMIN` roles.
   - Operations REST Endpoints (`router.py`):
     - `GET /api/v1/operations/health`
     - `GET /api/v1/operations/metrics`
     - `GET /api/v1/operations/providers`
     - `GET /api/v1/operations/recovery/status`
     - `GET /api/v1/operations/jobs`
     - `GET /api/v1/operations/audit`
     - `GET /api/v1/operations/cases/{case_id}/summary`
     - `POST /api/v1/operations/recovery/pause`
     - `POST /api/v1/operations/recovery/resume`
     - `POST /api/v1/operations/jobs/{job_id}/retry`
     - `POST /api/v1/operations/jobs/{job_id}/cancel`

```text
                OPERATIONS API
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     OBSERVABILITY   JOB OPS     RECOVERY OPS
          │            │            │
          └────────────┼────────────┘
                       ▼
              DETERMINISTIC
             RELIABILITY CONTROLS
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 PROVIDER HEALTH  CIRCUIT BREAKER  RECONCILIATION
        │              │              │
        └──────────────┼──────────────┘
                       ▼
             RECOVERY EXECUTION
                       │
                       ▼
        SIMULATED EXECUTION PROVIDER
```

### Mandatory Invariants Enforced
> - **"AI recommendations never directly control operational state."**
> - **"Operational controls never bypass deterministic policy authorization."**
> - **"UNKNOWN execution outcomes are never automatically treated as recovered."**

---

## 9. Phase 1I Production Security Layer

### Key Components

1. **Security Configuration Subsystem (`backend/app/security/config.py`)**:
   - `SecurityConfig` dataclass and `SecurityConfigurationError` exception.
   - Loads security parameters from environment variables (`RECOVERFLOW_WEBHOOK_SECRET`, `RECOVERFLOW_OPERATIONS_KEY`, `RECOVERFLOW_WEBHOOK_TOLERANCE_SECONDS`, `RECOVERFLOW_RATE_LIMIT_REQUESTS`, `RECOVERFLOW_RATE_LIMIT_WINDOW_SECONDS`, `RECOVERFLOW_ENVIRONMENT`, `RECOVERFLOW_REQUIRE_HTTPS`).
   - In `production` mode, fails closed if mandatory secrets are missing or default.

2. **Webhook HMAC Signature Verification & Replay Protection (`backend/app/security/`)**:
   - `HMACWebhookAuthenticator` (`event_auth.py`): Constant-time signature comparison using `hmac.compare_digest(...)`. Validates timestamp freshness against `webhook_timestamp_tolerance_seconds`.
   - `ReplayProtectionService` (`replay.py`): Thread-safe `InMemoryReplayProtectionStore` tracking consumed signatures/request IDs with bounded storage and TTL cleanup. Rejects duplicate signatures (`REPLAY_REJECTED`) and expired timestamps (`TIMESTAMP_EXPIRED`).

3. **Request Security Middleware & Rate Limiting (`backend/app/security/`)**:
   - `RequestSecurityMiddleware` (`request_security.py`): Generates or propagates `X-Correlation-ID` across HTTP requests, event processor, recovery loop, and audit events. Enforces request body size limits (2 MB) and sets OWASP security response headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`).
   - `RateLimiter` (`rate_limit.py`): Thread-safe sliding-window rate limiter enforcing limits for `WEBHOOK` (100 req/60s), `OPERATIONS` (60 req/60s), and `GENERAL_API` (120 req/60s), returning HTTP 429 (`RATE_LIMIT_EXCEEDED`).

4. **Operations Authentication Hardening (`backend/app/security/operations_auth.py`)**:
   - `ApiKeyOperationsAuthenticator`: Constant-time API key validation for operational endpoints. Enforces `VIEWER` (read-only), `OPERATOR` (read + pause/resume + job retry/cancel), and `ADMIN` (all capabilities). Blocks `DevelopmentOperationsAuthenticator` in production.

5. **Sanitized Error Handling & Security Audit Events (`backend/app/main.py`, `backend/app/domain/audit.py`)**:
   - Global exception handlers sanitizing stack traces, database errors, and secret leakage. Returns structured JSON error payloads containing `error`, `message`, and `correlation_id`.
   - Audit event types added: `AUTHENTICATION_SUCCEEDED`, `AUTHENTICATION_FAILED`, `AUTHORIZATION_DENIED`, `REPLAY_REJECTED`, `RATE_LIMIT_EXCEEDED`, `SECURITY_CONFIGURATION_ERROR`, `INVALID_SIGNATURE`, `EXPIRED_WEBHOOK`, `CORRELATION_ID_ASSIGNED`.

```text
                  EXTERNAL REQUEST
                         │
                         ▼
              [ Request Validation ]
                         │
                         ▼
              [ Rate Limiter ]  <-- [SECURITY CONTROLLED]
                         │
                         ▼
        [ RequestSecurityMiddleware ] (Correlation ID & Security Headers)
                         │
                         ▼
        [ Webhook HMAC Verification ]  <-- [SECURITY CONTROLLED]
                         │
                         ▼
            [ Replay Protection ]  <-- [SECURITY CONTROLLED]
                         │
                         ▼
             [ PaymentEventProcessor ]
                         │
                         ▼
            [ Recovery Opportunity ]
                         │
                         ▼
                 [ AI Reasoning ]  <-- [AI ADVISORY ONLY - ZERO EXECUTION AUTHORITY]
                         │
                         ▼
           [ Deterministic Policy Engine ]  <-- [DETERMINISTIC AUTHORIZATION CONTROLLED]
                         │
                         ▼
             [ Recovery Orchestrator ]
                         │
                         ▼
           [ SimulatedExecutionProvider ]  <-- [100% SIMULATED EXECUTION]
```

### Mandatory Invariants Enforced
> - **"AI Agent has ZERO execution authority or security credentials."**
> - **"No real financial execution occurs; execution is 100% simulated."**
> - **"Webhook authentication and replay protection occur BEFORE event processing."**
> - **"Production fails closed if mandatory secrets are missing."**
> - **"Secrets never leak in code, logs, audit metadata, exception messages, or API responses."**

---

## 10. Phase Status & Roadmap

- **Phase 0 (Foundation)**: Complete. FastAPI backend, Next.js frontend scaffold, health check endpoints (`GET /`, `GET /health`).
- **Phase 1A (Domain Model & Agent Architecture Foundation)**: Complete. Domain models, AI Agent reasoning interface, `PolicyEvaluationContext`, `DeterministicPolicyEngine`, `RecoveryOrchestrator` execution boundary, `RecoveryExecution` idempotency contract, and 16 unit tests passing.
- **Phase 1B (Recovery Intelligence & Opportunity Detection)**: Complete. `FailureClassifier`, `RecoverySignals`, `HeuristicRecoverabilityScorer`, `RecoveryOpportunity`, `RecoveryOpportunityDetector`, `ActionabilityState`, agent integration, and 18 unit tests passing (34 total backend tests passing).
- **Phase 1C (Autonomous Recovery Loop & Simulated Execution)**: Complete. `SimulatedRecoveryExecutor`, `SimulationScenario`, `RecoveryLoopService`, multi-step bounded recovery loop, state transitions, idempotency registry, 15 safety invariant tests, and end-to-end integration scenarios (68 total backend tests passing).
- **Phase 1D (Recovery Data & Benchmarking)**: Complete. `SyntheticDataGenerator`, `SyntheticDataset`, `BenchmarkScenarioLibrary`, `InMemoryRecoveryRepository`, 4 baseline strategies (including real RecoverFlow pipeline), `BenchmarkRunner`, `BenchmarkMetrics`, `BenchmarkReport`, and 27 new tests (95 total backend tests passing).
- **Phase 1F (Payment Event Ingestion & Persistence Boundary)**: Complete. `PostgresRepository`, `PaymentEventProcessor`, idempotent webhook endpoint (`POST /api/v1/events/payment-failure`), recovery timeline endpoint (`GET /api/v1/recovery/cases/{id}/timeline`), `RecoveryJobDispatcher`, `SimulatedRecoveryExecutionProvider`, Alembic migrations, CLI simulation script, and 16 new tests (111 total backend unit & integration tests passing).
- **Phase 1G (Production Recovery Execution Provider & Resilience)**: Complete. `ExecutionResult`, `SimulatedExecutionProvider`, `ExecutionProviderRouter`, `RecoveryExecutionModel`, `RecoveryJobModel`, `RecoveryRetryPolicy`, `RecoveryReconciliationService`, telemetry metrics, API endpoints, Alembic migration `002_phase_1g_schema.py`, correlation tracing, and 18 new tests (129 total backend unit & integration tests passing).
- **Phase 1H (Production Observability & Operations Platform)**: Complete. `HealthCheckService`, `TelemetryRegistry`, `RecoveryMetricsService`, `ProviderHealthMonitor`, `CircuitBreaker`, `RecoveryOperationsController`, `RecoveryJobOperationsService`, extended `RecoveryReconciliationService`, RBAC authentication (`X-Operations-Key`, `X-Operations-Role`), Operations REST endpoints under `/api/v1/operations/*`, Alembic migration `003_phase_1h_operations.py`, and 34 new unit, resilience, RBAC & integration tests (163 total backend unit & integration tests passing).
- **Phase 1I (Production Security, Authentication & Secrets Hardening)**: Complete. `SecurityConfig`, `HMACWebhookAuthenticator`, `ReplayProtectionService`, `RequestSecurityMiddleware`, `RateLimiter` sliding-window limiter, `ApiKeyOperationsAuthenticator`, global error sanitization, security audit logging & telemetry, executable CLI verification script (`scripts/security_verification.py`), and 29 new security & integration tests (192 total backend unit & integration tests passing).
- **Phase 1J (Production Job Infrastructure, Persistent Recovery Queue & Scalable Execution Architecture)**: Complete. Database-backed durable recovery queue, `JobStatus` & `JobType` domain enums, `RecoveryJob` dataclass, `JobRepository` with `FOR UPDATE SKIP LOCKED` atomic row locking, `RecoveryJobDispatcher` background enqueueing, deterministic exponential backoff `RetryPolicy`, `RecoveryWorker` process architecture delegating to `RecoveryLoopService`, worker crash recovery with lease timeouts, graceful shutdown, operational pause integration, circuit breaker protection, terminal case protection, operations REST endpoints under `/api/v1/operations/jobs*`, Alembic migration `004_phase_1j_jobs.py`, demonstration script (`scripts/run_worker_demo.py`), and 15 new worker & integration tests (207 total backend tests passing).
- **Phase 1K (Distributed Worker Orchestration, Event-Driven Recovery & Production Reliability)**: Complete. Multi-worker identity registration (`WorkerIdentity`, `WorkerRegistry`, `WorkerModel`), distributed job claiming semantics (`FOR UPDATE SKIP LOCKED`), `PriorityScheduler` with age-based anti-starvation boost, `BackpressureController` queue capacity protection (`NORMAL`, `ELEVATED`, `HIGH`, `CRITICAL`), `JobDeduplicationService` duplicate job suppression, in-process domain event bus (`InMemoryEventBus`), `EventConsumerIdempotencyService`, worker concurrency control (`max_concurrent_jobs`) and graceful draining (`DRAINING`), `JobQueueReconciliationService`, `MaintenanceService`, operations REST endpoints, Alembic migration `005_phase_1k_distributed_workers.py`, demonstration script (`scripts/run_distributed_worker_demo.py`), and 20 new tests (227 backend tests passing).
- **Phase 2A (Real Payment Provider Integration — Razorpay)**: Complete. `ProviderConfig` layer (`RECOVERFLOW_PAYMENT_PROVIDER`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_ENVIRONMENT`), provider-neutral `NormalizedProviderResult` & `ProviderStatus`, `RazorpayClient` REST client, `RazorpayExecutionProvider` implementing `RecoveryExecutionProvider`, Action Capability Matrix (`SEND_PAYMENT_LINK`, `RETRY_IMMEDIATE`, `RETRY_AFTER_DELAY`, `SEND_PAYMENT_REMINDER` $\rightarrow$ `UNSUPPORTED`), `get_active_provider()` factory, `ExecutionProviderRouter` integration, `RazorpayWebhookNormalizer`, `HMACWebhookAuthenticator` verification (`X-Razorpay-Signature`), `RecoveryReconciliationService` unknown state protection (`UNKNOWN` / `TIMEOUT` $\rightarrow$ `MANUAL_REVIEW`), `ProviderHealthMonitor` integration, Alembic migration `006_phase_2a_razorpay_provider.py`, operations endpoints (`/api/v1/operations/providers*`, `/executions/{id}`), sandbox verification script (`scripts/razorpay_provider_verification.py`), and 13 new unit, contract, idempotency, error, webhook & integration tests (240 backend unit & integration tests passing, 100% pass rate).
- **Phase 2B+ (Future Development)**: Production Razorpay API integration adapter, real-money execution gateway, external LLM providers (OpenAI/Gemini/Claude), Next.js merchant dashboard.






