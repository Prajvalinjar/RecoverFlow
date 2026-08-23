# RecoverFlow

**Autonomous Revenue Recovery System**  
*Razorpay Buildathon — Track 03: AI Revenue Recovery*

---

## CURRENT IMPLEMENTATION (Phase 0)

Phase 0 establishes the minimal monorepo foundation for RecoverFlow.

## CURRENT IMPLEMENTATION STATUS

- **Phase 0 (Foundation)**: Complete. FastAPI backend, Next.js frontend scaffold, health check endpoints (`GET /`, `GET /health`).
- **Phase 1A (Domain Model & Agent Architecture)**: Complete. Domain models, AI Agent reasoning interface (`PrototypeRecoveryAgent`), `PolicyEvaluationContext`, `DeterministicPolicyEngine`, `RecoveryOrchestrator` execution boundary, `RecoveryExecution` idempotency contract.
- **Phase 1B (Recovery Intelligence & Opportunity Detection)**: Complete. `FailureClassifier`, `RecoverySignals`, `HeuristicRecoverabilityScorer`, `RecoveryOpportunity`, `RecoveryOpportunityDetector`, `ActionabilityState`.
- **Phase 1C (Autonomous Recovery Loop & Simulated Execution)**: Complete. `SimulatedRecoveryExecutor`, `SimulationScenario`, `RecoveryLoopService`, multi-step bounded recovery loop, state transitions, idempotency registry, safety invariant tests, and end-to-end integration scenarios.
- **Phase 1D (Recovery Data & Benchmarking)**: Complete. `SyntheticDataGenerator`, `SyntheticDataset`, `BenchmarkScenarioLibrary`, `InMemoryRecoveryRepository`, 4 baseline strategies (`No Recovery`, `Blind Retry`, `Repeated Retry`, `RecoverFlow`), `BenchmarkRunner`, `BenchmarkMetrics`, `BenchmarkReport`, and benchmark script.
- **Phase 1F (Payment Event Ingestion & Persistent Recovery Boundary)**: Complete. PostgreSQL ORM models, Alembic migrations, `PostgresRepository`, idempotent webhook endpoint (`POST /api/v1/events/payment-failure`), timeline read endpoint (`GET /api/v1/recovery/cases/{id}/timeline`), `RecoveryJobDispatcher`, `SimulatedRecoveryExecutionProvider`, event simulation CLI (111 backend unit & integration tests passing).
- **Phase 1G (Production Recovery Execution Provider & Resilience)**: Complete. `ExecutionResult`, `SimulatedExecutionProvider`, `ExecutionProviderRouter`, `RecoveryExecutionModel`, `RecoveryJobModel`, `RecoveryRetryPolicy`, `RecoveryReconciliationService`, telemetry metrics (`/api/v1/metrics`), API endpoints, Alembic migration `002_phase_1g_schema.py`, correlation tracing, and 18 new tests (129 backend unit & integration tests passing).
- **Phase 1H (Production Observability & Operations Platform)**: Complete. `HealthCheckService`, `TelemetryRegistry`, `RecoveryMetricsService`, `ProviderHealthMonitor`, `CircuitBreaker`, `RecoveryOperationsController`, `RecoveryJobOperationsService`, extended `RecoveryReconciliationService`, RBAC authentication (`X-Operations-Key`, `X-Operations-Role`), Operations REST endpoints under `/api/v1/operations/*`, Alembic migration `003_phase_1h_operations.py`, and 34 new unit, resilience, RBAC & integration tests (163 backend unit & integration tests passing).
- **Phase 1I (Production Security, Authentication & Secrets Hardening)**: Complete. `SecurityConfig`, `HMACWebhookAuthenticator`, `ReplayProtectionService`, `RequestSecurityMiddleware`, `RateLimiter` sliding-window limiter, `ApiKeyOperationsAuthenticator`, global error sanitization, security audit logging & telemetry, executable CLI verification script (`scripts/security_verification.py`), and 29 new security & integration tests (192 backend unit & integration tests passing).
- **Phase 1J (Production Job Infrastructure, Persistent Recovery Queue & Scalable Execution Architecture)**: Complete. Database-backed durable recovery queue, `JobStatus` & `JobType` domain enums, `RecoveryJob` dataclass, `JobRepository` with `FOR UPDATE SKIP LOCKED` atomic row locking, `RecoveryJobDispatcher` background enqueueing, deterministic exponential backoff `RetryPolicy`, `RecoveryWorker` process architecture delegating to `RecoveryLoopService`, worker crash recovery with lease timeouts, graceful shutdown, operational pause integration, circuit breaker protection, terminal case protection, operations REST endpoints under `/api/v1/operations/jobs*`, Alembic migration `004_phase_1j_jobs.py`, demonstration script (`scripts/run_worker_demo.py`), and 15 new worker & integration tests (207 backend unit & integration tests passing).
- **Phase 1K (Distributed Worker Orchestration, Event-Driven Recovery & Production Reliability)**: Complete. Multi-worker identity registration (`WorkerIdentity`, `WorkerRegistry`, `WorkerModel`), distributed job claiming semantics (`FOR UPDATE SKIP LOCKED`), `PriorityScheduler` with age-based anti-starvation boost ($\text{effective\_priority} = \text{base\_priority} + \lfloor \text{age\_seconds} \times 0.1 \rfloor$), `BackpressureController` queue capacity protection (`NORMAL`, `ELEVATED`, `HIGH`, `CRITICAL`), `JobDeduplicationService` duplicate job suppression, in-process domain event bus (`InMemoryEventBus`, `EventPublisher`), `EventConsumerIdempotencyService` storing `EventProcessingRecordModel` records to guarantee `(event_id, consumer_name)` uniqueness, worker concurrency control (`max_concurrent_jobs`) and graceful draining (`DRAINING`), `JobQueueReconciliationService`, `MaintenanceService`, operations REST endpoints (`/api/v1/operations/workers*`, `/queue*`, `/events*`, `/backpressure`), Alembic migration `005_phase_1k_distributed_workers.py`, demonstration script (`scripts/run_distributed_worker_demo.py`), and 20 new tests (227 backend unit & integration tests passing, 100% pass rate).
- **Phase 2A (Real Payment Provider Integration)**: Complete. `ProviderConfig` layer (`simulated`, `razorpay`), provider-neutral `NormalizedProviderResult` & `ProviderStatus`, `RazorpayClient` REST client, `RazorpayExecutionProvider` implementing `RecoveryExecutionProvider`, Action Capability Matrix (`SEND_PAYMENT_LINK`, `RETRY_IMMEDIATE`, `RETRY_AFTER_DELAY`, `SEND_PAYMENT_REMINDER` $\rightarrow$ `UNSUPPORTED`), `get_active_provider()` factory, `RazorpayWebhookNormalizer`, `HMACWebhookAuthenticator` verification (`X-Razorpay-Signature`), `RecoveryReconciliationService` unknown state protection (`UNKNOWN` / `TIMEOUT` $\rightarrow$ `MANUAL_REVIEW`), `ProviderHealthMonitor` integration, Alembic migration `006_phase_2a_razorpay_provider.py`, operations endpoints (`/api/v1/operations/providers*`, `/executions/{id}`), sandbox verification script (`scripts/razorpay_provider_verification.py`), and 13 new unit, contract, idempotency, error, webhook & integration tests (240 backend unit & integration tests passing).

### Quick Commands

#### Run Backend Tests
```powershell
cd backend
.\venv\Scripts\pytest.exe
```

#### Run Razorpay Provider Verification Script (Phase 2A)
```powershell
cd backend
.\venv\Scripts\python.exe scripts/razorpay_provider_verification.py
```

#### Run Distributed Worker Demonstration Script (Phase 1K)
```powershell
cd backend
.\venv\Scripts\python.exe scripts/run_distributed_worker_demo.py
```

#### Run Worker Architecture Demonstration (Phase 1J)
```powershell
cd backend
.\venv\Scripts\python.exe scripts/run_worker_demo.py
```

#### Run Security Verification Script (Phase 1I)
```powershell
cd backend
.\venv\Scripts\python.exe scripts/security_verification.py
```

#### Run Database Migrations
```powershell
cd backend
.\venv\Scripts\alembic.exe upgrade head
```

#### Run Local Webhook Payment Event Simulation (Phase 1F)
```powershell
cd backend
.\venv\Scripts\python.exe scripts/simulate_payment_event.py --payment-id pay_demo_101 --customer-id cust_demo_202 --amount 4999 --failure-code BANK_TIMEOUT --event-id evt_demo_001
```

#### Run Autonomous Recovery Demonstration (Phase 1C)
```powershell
cd backend
.\venv\Scripts\python.exe scripts/demo_recovery.py
```

#### Run Comparative Revenue Recovery Benchmark (Phase 1D)
```powershell
cd backend
.\venv\Scripts\python.exe scripts/generate_benchmark.py
```

#### Run Frontend Production Build
```powershell
cd frontend
npm run build
```

> **Security & Invariant Note:** AI recommendations NEVER directly authorize financial execution. Webhook event ingestion is an event boundary, not an execution boundary. Real-money payment execution remains explicitly disabled in Phase 1F.


---

## PLANNED ARCHITECTURE (Target State)

The target end-to-end architecture for RecoverFlow will implement an autonomous revenue recovery lifecycle:

```
Payment Event
    ↓
Case Detection
    ↓
Root-Cause Analysis
    ↓
AI Recovery Agent
    ↓
Policy Engine
    ↓
Recovery Orchestrator
    ↓
Retry / Reminder / Escalation
    ↓
Outcome Verification
    ↓
Revenue Recovered
    ↓
Audit Trail
```

### Planned Components
1. **Case Detection**: Ingestion of Razorpay Test Mode events and synthetic payment failure datasets.
2. **Root-Cause Analysis & AI Agent**: Classification of payment failure causes and AI-driven recovery action recommendations.
3. **Policy Engine & Recovery Orchestrator**: Deterministic policy validation enforcing bounded, compliant recovery retries and reminders.
4. **Outcome Verification & Audit Logging**: Tracking recovered revenue and maintaining full audit trails.
5. **Merchant Dashboard**: Next.js interface for recovery analytics and management.

---

## Repository Structure

```
recoverflow/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   ├── tests/
│   │   └── test_main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── docs/
│   └── architecture/
│       └── overview.md
│
├── data/
│   └── .gitkeep
│
├── scripts/
│   └── .gitkeep
│
└── .gitignore
```

---

## Local Development Setup

### 1. Prerequisites
- **Python**: 3.14+ (Verified on Python 3.14.6)
- **Node.js**: v25.8.0+ / npm 11.11.0+

### 2. Running the Backend (`recoverflow-api`)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload --port 8000
```
- API Root: `http://localhost:8000/`
- API Health Check: `http://localhost:8000/health`

### 3. Running the Frontend (`RecoverFlow`)
```powershell
cd frontend
npm install
npm run dev
```
- Local Application: `http://localhost:3000/`
