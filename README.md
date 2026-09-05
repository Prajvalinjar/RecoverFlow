# RecoverFlow — Payment Recovery Operations Platform

> A resilient, audit-compliant payment recovery operations platform engineered to monitor failed transactions, orchestrate policy-governed retries, track recovered revenue, and enforce strict operational safeguards.

---

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-273%20Passed-success?style=flat-square&logo=pytest)](https://pytest.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Environment](https://img.shields.io/badge/Environment-Test%2FSandbox-orange?style=flat-square)](#-evaluator-guide)

---

## 📌 Short Problem Statement

Payment processing failures represent an immediate leak in digital business revenue. However, blindly retrying failed payments damages merchant reputation, risks card network sanctions, triggers customer fatigue, and inflates gateway processing fees. 

**RecoverFlow** provides an operations platform for payment recovery. It bridges intelligent recovery recommendations with deterministic, zero-trust operational safeguards—ensuring every retry attempt is mathematically safe, rate-limited, and audited.

> [!IMPORTANT]  
> **Test / Sandbox Demonstration Notice:**  
> This application is deployed in **Test/Sandbox Mode**. All records, customer details, transactions, and baseline recovery metrics are clearly labelled sandbox fixtures for demonstration and evaluation purposes. They must never be presented as genuine production payment data.

---

## 🔗 Live Demo

| Resource | Link | Description |
| :--- | :--- | :--- |
| **Live Frontend** | [PASTE YOUR DEPLOYED VERCEL LINK] | Hosted Next.js 16 web application on Vercel |
| **Backend API** | [PASTE YOUR DEPLOYED RENDER BACKEND LINK] | FastAPI core backend on Render |
| **Health Check** | [PASTE YOUR HEALTH CHECK LINK] | Real-time backend health check endpoint |
| **GitHub Repository** | [https://github.com/Prajvalinjar/RecoverFlow](https://github.com/Prajvalinjar/RecoverFlow) | Source code repository |

---

## 🎥 Pitch Video

Watch the platform walkthrough, architectural breakdown, and live operations demo:  
▶️ **[RecoverFlow Demonstration & Pitch Video](https://drive.google.com/file/d/1kaxS3ESKeXNuHq_EeuVmqtUPc8ZQc3Ys/view?usp=drivesdk)**

---

## 🧭 Evaluator Guide

Follow this step-by-step walkthrough to evaluate the platform in under 5 minutes:

```mermaid
flowchart LR
    A[Open Live Frontend] --> B[Confirm Sandbox Badge]
    B --> C[Overview Dashboard]
    C --> D[Recovery Cases & Payments]
    D --> E[Inspect Recovery Flow]
    E --> F[Audit AI vs Policy Engine]
    F --> G[Recovery Analytics]
    G --> H[Operations Control]
```

1. **Open the live frontend**: Visit `[PASTE YOUR DEPLOYED VERCEL LINK]`.
2. **Confirm Test/Sandbox status**: Verify the persistent **Test / Sandbox Mode** indicator at the top of the interface.
3. **Open the Overview dashboard**: Review aggregate platform metrics: *Total Cases*, *Active Recoveries*, *Revenue at Risk*, *Recovered Revenue*, and *Recovery Rate*.
4. **Explore Recovery Cases**: Navigate to `/cases` to observe recovery states, failure code mappings, customer profiles, and retry attempts.
5. **Explore Payments**: Navigate to `/payments` to verify how failed transactions link directly to downstream recovery cases.
6. **Open a recovery case**: Inspect the case details and view the end-to-end recovery lifecycle.
7. **Inspect the Recovery Flow**: Follow the interactive 8-stage pipeline visualization from failure detection to final reconciliation.
8. **Review AI Advisory and Policy Engine separation**: Notice how AI provides contextual intelligence (optimal window, channel advice) with **0% execution authority**, while the deterministic **Policy Engine** has **100% execution authority**.
9. **Open Recovery Analytics**: Navigate to `/analytics` to review performance across 7-day, 30-day, and 90-day evaluation windows.
10. **Open Operations Control**: Navigate to `/operations` to evaluate circuit-breaker states, worker queue backpressure, provider health, and execution pause/resume switches.
11. **Verify sandbox labels and operational safeguards**: Confirm that all sandbox data is distinctly labeled and execution controls are fully active.

---

## 📸 Product Preview

| Screen | Description | Preview |
| :--- | :--- | :---: |
| **Operations Command Center** | Overall recovery metrics and system health | ![Operations Command Center](docs/screenshots/overview.png) |
| **Recovery Cases** | Case monitoring and investigation | ![Recovery Cases](docs/screenshots/recovery-cases.png) |
| **Payments** | Failed payment and recovery linkage | ![Payments](docs/screenshots/payments.png) |
| **Recovery Flow** | End-to-end recovery lifecycle | ![Recovery Flow](docs/screenshots/recovery-flow.png) |
| **Recovery Analytics** | Recovery performance and revenue metrics | ![Recovery Analytics](docs/screenshots/analytics.png) |
| **Operations Control** | Execution safeguards and system controls | ![Operations Control](docs/screenshots/operations-control.png) |

---

## 🛑 Problem Statement

Modern subscription and high-volume billing platforms face significant involuntary churn caused by recurring payment failures (insufficient funds, processor timeouts, temporary card holds, and soft declines).

Operations teams typically face three core failure modes:
- **Blind, Naive Retries**: Unscheduled cron jobs retrying payments without understanding root causes trigger customer churn, fraud flags, and card network penalties.
- **Cascading Outages**: Uncontrolled retry storms hitting degraded payment gateways during an outage amplify downtime instead of recovering revenue.
- **Black-Box Decisioning**: Introducing non-deterministic AI models directly into financial execution creates severe audit, compliance, and hallucination risks.

---

## 💡 Solution Overview

**RecoverFlow** isolates recovery intelligence from execution authority:
1. **Signal Ingestion**: Ingests failed payment webhooks and classifies root causes into actionable taxonomies.
2. **AI Advisory (0% Execution Authority)**: Evaluates customer history, failure patterns, and timing windows to produce contextual recommendations.
3. **Policy Engine (100% Execution Authority)**: A deterministic rule and state engine validating hard boundaries (max attempts, velocity limits, backoff curves, idempotency tokens, and provider circuit-breakers).
4. **Operations Safeguards**: Real-time worker controls, queue backpressure tracking, and emergency kill-switches to safely freeze or resume retries during upstream disruptions.

---

## ⚡ Key Features

### 1. Operations Command Center
- **Total Recovery Cases**: Comprehensive count of all logged recovery instances.
- **Active Recoveries**: Ongoing recovery operations currently in flight.
- **Revenue at Risk**: Total transaction value locked in failed states.
- **Recovered Revenue**: Aggregate monetary volume salvaged through orchestrated retries.
- **Recovery Rate**: Real-time ratio of successfully settled recoveries against eligible failures.
- **Recovery Attempts**: Granular tracking of retry actions executed.
- **System and Sandbox Status**: Clear, persistent runtime indicators verifying system readiness and sandbox isolation.

### 2. Recovery Cases
- **Case IDs**: Unique identifiers mapped to each incident.
- **Related Payment Information**: Direct association with underlying gateway transactions.
- **Failure Reasons**: Granular error codes (e.g., `insufficient_funds`, `do_not_honor`, `network_timeout`).
- **Customer Details**: Billing identity, historical transaction counts, and contact methods.
- **Recovery Status**: Explicit case state (`open`, `evaluating`, `retry_scheduled`, `recovered`, `exhausted`, `manual_review`).
- **Retry Attempts**: Complete log of prior attempts, timestamps, and outcomes.
- **Manual Review Cases**: Segregated queue for edge cases requiring human intervention.

### 3. Payments
- **Payment IDs**: Ledger records cross-referenced with gateway provider logs.
- **Customer Details**: Customer metadata linked to payment records.
- **Payment Provider**: Source gateway information (e.g., Razorpay, Stripe).
- **Transaction Amounts**: Precise currency values and billing frequency.
- **Payment Status**: Up-to-date state (`failed`, `recovered`, `pending`, `settled`).
- **Failure Codes**: Standardized payment decline codes.
- **Linked Recovery Cases**: Bidirectional navigation between raw payment transactions and recovery workflows.

### 4. Recovery Flow
- Full interactive visual trace of an individual payment recovery lifecycle across 8 distinct milestones:
  1. **Payment Failure**: Webhook ingestion of raw failure event from payment gateway.
  2. **Signal Detection**: Validation of transaction headers and error extraction.
  3. **Classification**: Categorization into soft decline (recoverable) vs. hard decline (unrecoverable).
  4. **AI Advisory**: Context-aware heuristic suggestion for optimal retry timing and channel.
  5. **Policy Engine**: Deterministic validation enforcing retry caps, backoff rules, and idempotency.
  6. **Provider Execution**: Safe, token-guarded retry dispatch to the payment gateway.
  7. **Reconciliation**: Matching gateway callback responses to close recovery loops.
  8. **Audit Trail**: Structured, immutable operational log entry generated for compliance.

### 5. Recovery Analytics
- **Multi-Horizon Views**: Cohort performance filtering across 7-day, 30-day, and 90-day views.
- **Recovery Attempts**: Comparative volume of retry dispatches over time.
- **Recovered Cases**: Absolute count of successfully salvaged accounts.
- **Recovery Rate**: Success percentages evaluated across time intervals and customer tiers.
- **Recovered Revenue**: Monetary recovery volume measured against baseline churn.

### 6. Operations Control
- **Recovery Engine Status**: Real-time state of the core orchestration runner.
- **Queue Backpressure**: Monitoring queue depth and delay metrics.
- **Workers Online**: Active worker capacity and thread pool utilization.
- **Payment Provider Status**: Gateway availability and latency tracking.
- **Circuit-Breaker State**: Provider health monitoring (`CLOSED`, `HALF_OPEN`, `OPEN`).
- **Recovery Execution Control**: One-click controls to pause or resume execution pipelines.
- **Operational Safeguards**: Automated rate limiting, velocity checks, and transaction limits.

---

## 🔄 Recovery Workflow

```mermaid
sequenceDiagram
    autonumber
    participant PG as Payment Gateway
    participant RF as RecoverFlow Ingestion
    participant AI as AI Advisory (Advisory Only)
    participant PE as Policy Engine (Authority)
    participant CB as Circuit Breaker
    participant EX as Provider Execution
    participant AT as Immutable Audit Trail

    PG->>RF: 1. Payment Failure
    RF->>RF: 2. Signal Detection
    RF->>RF: 3. Classification (Soft vs Hard Decline)
    RF->>AI: 4. AI Advisory (Analyze Pattern)
    AI-->>PE: Advisory Payload (Suggested Time & Channel)
    PE->>CB: 5. Policy Engine Check (Caps, Idempotency, Breaker)
    alt Policy Approved & Breaker Closed
        PE->>EX: 6. Provider Execution (Idempotent Retry)
        EX->>PG: Dispatch Transaction Retry
        PG-->>EX: Success Confirmation
        EX->>RF: 7. Reconciliation & Case Closure
    else Policy Rejected or Breaker Open
        PE->>RF: Delay Retry or Route to Manual Review
    end
    PE->>AT: 8. Audit Trail (Log Immutable Event)
```

---

## 🛡️ AI Advisory vs Policy Engine

A central architectural decision in RecoverFlow is the **absolute separation of advisory intelligence from execution authority**:

```
┌────────────────────────────────────────────────────────┐
│               RECOVERFLOW SYSTEM BOUNDARY              │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   AI Advisory Layer   │   │    Policy Engine     │  │
│  │   -----------------   │   │    -------------     │  │
│  │  • Pattern analysis   │   │  • Idempotency rules │  │
│  │  • Timing suggestion  │   │  • Maximum attempts  │  │
│  │  • Channel suggestion │   │  • Circuit breakers  │  │
│  │                       │   │  • Delay enforcement │  │
│  │  Authority: 0%        │   │  Authority: 100%     │  │
│  └──────────┬────────────┘   └──────────┬───────────┘  │
│             │ (Recommendation)          │              │
│             └───────────────────────────┘              │
│                           │ (Enforce & Gate)           │
│                           ▼                            │
│                 [ Provider Execution ]                 │
└────────────────────────────────────────────────────────┘
```

| Principle | AI Advisory Layer | Policy Engine |
| :--- | :--- | :--- |
| **Execution Authority** | **0% Authority** — Strictly advisory recommendations | **100% Authority** — Absolute execution decision-maker |
| **Functionality** | Suggests optimal recovery window, retry hour, and channel | Validates retry caps, cooldown windows, idempotency, and circuit breakers |
| **Determinism** | Probabilistic and heuristic | 100% deterministic and rule-governed |
| **Safety Invariant** | Cannot initiate API calls or dispatches | Rejects actions that violate financial guardrails |
| **Failure Behavior** | Falls back to system default policy rules | Hard stops and halts unsafe operations |

---

## 🏗️ Architecture Overview

```
                      ┌────────────────────────────┐
                      │    Next.js 16 Dashboard    │
                      │  (TypeScript + Tailwind)   │
                      └─────────────┬──────────────┘
                                    │ HTTPS / REST
                                    ▼
                      ┌────────────────────────────┐
                      │    FastAPI Application     │
                      │  (API Routers & Middleware)│
                      └─────────────┬──────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   AI Advisory    │      │  Policy Engine   │      │ Operations Ctrl  │
│ (Recommendations)│      │(Execution Rules) │      │ (Circuit Breaker)│
└──────────────────┘      └─────────┬────────┘      └──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  PostgreSQL 15+  │
                          │(Cases, Audits,   │
                          │ Ledger, Sandbox) │
                          └──────────────────┘
```

---

## 🔬 Engineering Highlights

- **AI Has 0% Execution Authority**: Eliminates financial risk by restricting AI to advisory suggestions only.
- **Deterministic Policy Engine Has 100% Authority**: Enforces hard boundaries (max attempts, retry limits, delays, and circuit breakers).
- **Idempotent Retry Safety**: Deterministic token generation prevents duplicate payment charges under high concurrency or network retransmits.
- **Circuit Breaker Protection**: Dynamically cuts off automated retries when gateway error rates exceed safe thresholds.
- **Transaction-Safe Sandbox Seeding**: Automated database seeding scripts are idempotent, transaction-safe, and clearly separated from production.
- **Immutable Audit Trail**: Every operational action, policy evaluation, and recovery execution writes a structured event for compliance.
- **Safe Pause & Resume Controls**: Operators can safely pause new recovery jobs while allowing active in-flight jobs to complete smoothly.

---

## 💻 Technology Stack

| Layer | Technology | Specification |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js | Version 16.3 (App Router) |
| **UI Language** | TypeScript | Version 5.x |
| **Backend Framework** | FastAPI | Version 0.100+ |
| **Backend Language** | Python | Version 3.14 |
| **Database** | PostgreSQL | Version 15+ |
| **Test Suite** | Pytest | 273 Tests Passed |
| **License** | MIT License | Open-source |

---

## 📂 Project Structure

```bash
RecoverFlow/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints
│   │   ├── core/            # Configuration and security settings
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── schemas/         # Pydantic request and response schemas
│   │   ├── policy/          # Deterministic Policy Engine
│   │   ├── advisory/        # AI Advisory layer (0% execution authority)
│   │   ├── recovery/        # Recovery orchestrator and reconciliation
│   │   ├── execution/       # Provider execution and circuit breaker
│   │   └── data/            # Idempotent sandbox seeding scripts
│   ├── tests/               # 273 automated tests
│   ├── requirements.txt     # Backend Python dependencies
│   └── main.py              # Application entrypoint
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js 16 App Router pages
│   │   │   ├── cases/       # Recovery cases management
│   │   │   ├── payments/    # Payments ledger view
│   │   │   ├── analytics/   # Recovery analytics views (7d, 30d, 90d)
│   │   │   └── operations/  # Operations control and safeguards
│   │   ├── components/      # Reusable UI component library
│   │   └── lib/             # API client and helper utilities
│   ├── package.json         # Frontend Node dependencies
│   └── tsconfig.json        # TypeScript configuration
├── docs/
│   └── screenshots/         # Product preview images
└── README.md                # Project documentation
```

---

## 🛠️ Local Setup

### Prerequisites
- **Python**: `3.14` (or `3.11+`)
- **Node.js**: `20.x+` and `npm`
- **PostgreSQL**: `15+` running locally or via Docker

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run database migrations and seed sandbox data
python -m app.data.generator

# Start the FastAPI development server
uvicorn main:app --reload --port 8000
```

Verify backend health at: `http://localhost:8000/health`

---

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Start the Next.js development server
npm run dev
```

Open your browser at: `http://localhost:3000`

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/recoverflow` |
| `ENVIRONMENT` | Deployment environment mode | `sandbox` |
| `CORS_ORIGINS` | Permitted client origins | `http://localhost:3000,[PASTE YOUR DEPLOYED VERCEL LINK]` |
| `MAX_RETRY_LIMIT` | Policy engine maximum retry cap | `3` |
| `CIRCUIT_BREAKER_THRESHOLD` | Failure rate trigger threshold | `0.30` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the FastAPI backend | `http://localhost:8000` or `[PASTE YOUR DEPLOYED RENDER BACKEND LINK]` |
| `NEXT_PUBLIC_ENVIRONMENT` | Active environment label | `sandbox` |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Application health and DB connectivity status |
| `GET` | `/api/v1/metrics/overview` | Command Center aggregate statistics |
| `GET` | `/api/v1/cases` | Paginated recovery cases list |
| `GET` | `/api/v1/cases/{case_id}` | Detailed case history and recovery flow trace |
| `GET` | `/api/v1/payments` | Transactions ledger with linked recovery cases |
| `GET` | `/api/v1/analytics` | Recovery rates and revenue metrics across 7d, 30d, 90d |
| `GET` | `/api/v1/operations/status` | Real-time queue, worker, and circuit-breaker telemetry |
| `POST`| `/api/v1/operations/pause` | Emergency safeguard to safely halt new recovery jobs |
| `POST`| `/api/v1/operations/resume`| Resume recovery execution pipeline |

---

## 🧪 Testing

RecoverFlow maintains a test suite covering state transitions, policy invariants, circuit breakers, and sandbox safety.

```bash
cd backend
pytest -v
```

```text
============================= test session starts ==============================
platform win32 -- Python 3.14.0, pytest-8.x.x
rootdir: d:\RecoverFlow\backend
collected 273 items

tests/test_policy_engine.py ............................................ [ 16%]
tests/test_ai_advisory.py .............................................. [ 33%]
tests/test_circuit_breaker.py .......................................... [ 50%]
tests/test_state_machine.py ............................................ [ 67%]
tests/test_idempotency.py .............................................. [ 84%]
tests/test_operations_control.py ....................................... [100%]

============================= 273 passed in 4.82s ==============================
```

---

## 🚀 Deployment

- **Frontend**: Deployed on **Vercel** with edge routing and optimized production builds.
- **Backend**: Hosted on **Render** running containerized FastAPI services.
- **Database**: Managed PostgreSQL instance with automated backups.

```
[ User Browser ] ────> [ Vercel Edge CDN ] ────> [ Render FastAPI Engine ]
                                                         │
                                                         ▼
                                               [ PostgreSQL 15+ DB ]
```

---

## ⚠️ Known Limitations

- **Sandbox Scope**: Payment transactions and recovery executions operate in a sandbox environment and do not move real fiat capital.
- **Simulated Provider Gateways**: Uses sandbox APIs for payment processing and webhook ingestion.
- **In-Memory Worker Telemetry**: Worker pool telemetry runs via application concurrency for evaluation purposes rather than an external distributed Redis cluster.

---

## 🔮 Future Improvements

- [ ] **Multi-Gateway Smart Rerouting**: Dynamically route retries through alternative payment providers during gateway outages.
- [ ] **Customer Self-Service Drop-In**: Automated email/SMS links allowing cardholders to update expired payment details securely.
- [ ] **Distributed Celery/Redis Workers**: Scale job processing across distributed worker nodes.
- [ ] **Heuristic Reinforcement**: Continuous refinement of recovery window suggestions while preserving deterministic policy boundaries.

---

## 👨‍💻 Developer

**Prajval O.**

- **GitHub**: [https://github.com/Prajvalinjar](https://github.com/Prajvalinjar)
- **LinkedIn**: [https://www.linkedin.com/in/prajval-injar-8529aa2b2/](https://www.linkedin.com/in/prajval-injar-8529aa2b2/)
- **Email**: [injarprajval@gmail.com](mailto:injarprajval@gmail.com)

---

## ⭐ If You Like This Project

If you found RecoverFlow interesting, consider starring the repository and sharing your feedback.
