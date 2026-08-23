# Phase 2A — Razorpay Payment Provider Integration Architecture

## System Vision & Architectural Isolation

RecoverFlow Phase 2A integrates a production-grade payment provider abstraction around **Razorpay** (supporting TEST/SANDBOX mode first).

To strictly guarantee financial safety:
- **The AI Agent has ZERO financial execution authority.** AI is advisory only.
- **Deterministic Policy Engine** is the sole authorization authority.
- **RecoveryOrchestrator** is the sole execution authority boundary.
- **RazorpayExecutionProvider** receives ONLY authorized `RecoveryExecution` instances downstream of policy approval.
- **SimulatedExecutionProvider** remains available and defaults for local development.

```
       [ Payment Failure Event ]
                  │
                  ▼
       [ Recovery Intelligence ]
                  │
                  ▼
          [ AI Reasoning ]  <-- [ADVISORY ONLY - ZERO CREDENTIALS]
                  │
                  ▼
     [ Deterministic Policy Engine ]  <-- [AUTHORIZATION AUTHORITY]
                  │
                  ▼
       [ Recovery Orchestrator ]  <-- [EXECUTION AUTHORITY GATEKEEPER]
                  │
                  ▼
     [ RecoveryExecutionProvider ]
       /                      \
      v                        v
[RazorpayExecutionProvider]  [SimulatedExecutionProvider]
      │                        │
      v                        v
[Razorpay TEST API]      [Simulated Execution]
      │                        │
      └───────────┬────────────┘
                  │
                  ▼
   [ NormalizedProviderResult ]
                  │
                  ▼
  [ RecoveryReconciliationService ]  <-- [UNKNOWN / TIMEOUT -> MANUAL_REVIEW]
                  │
                  ▼
       [ Persistent DB State ]
```

---

## Action Capability Matrix

RecoverFlow actions map deterministically to Razorpay REST operations:

| RecoverFlow Action | Razorpay REST API Endpoint | Supported? | Status Outcome |
|---|---|---|---|
| `SEND_PAYMENT_LINK` | `POST /v1/payment_links` | **YES** | `ACCEPTED` / `COMPLETED` |
| `RETRY_IMMEDIATE` | `POST /v1/payments/{id}/capture` | **YES** | `ACCEPTED` / `COMPLETED` |
| `RETRY_AFTER_DELAY` | `POST /v1/payments/{id}/capture` | **YES** | `ACCEPTED` / `COMPLETED` |
| `SEND_PAYMENT_REMINDER` | N/A | **NO** | `REJECTED` (`UNSUPPORTED_OPERATION`) |
| `ESCALATE_TO_MERCHANT` | N/A | **NO** | `REJECTED` (`UNSUPPORTED_OPERATION`) |
| `STOP_RECOVERY` | N/A | **NO** | `REJECTED` (`UNSUPPORTED_OPERATION`) |

> [!IMPORTANT]
> If an action is not supported by Razorpay, the provider returns a deterministic `status = UNSUPPORTED` result. It **NEVER** fakes success and **NEVER** executes an unauthorized alternate operation.

---

## Provider Configuration & Environment Variables

```env
RECOVERFLOW_PAYMENT_PROVIDER=razorpay
RAZORPAY_ENVIRONMENT=test
RAZORPAY_KEY_ID=rzp_test_YourKeyHere
RAZORPAY_KEY_SECRET=YourSecretHere
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere
```

- Local/Default: `RECOVERFLOW_PAYMENT_PROVIDER=simulated` (requires 0 Razorpay credentials).
- Production Mode (`RAZORPAY_ENVIRONMENT=production`): Fails closed immediately if mandatory credentials or webhook secrets are missing. Secrets are concealed from logs, exception traces, string representations, and API responses.

---

## Webhook Ingestion & HMAC Verification

Razorpay webhooks enter through `POST /api/v1/events/payment-failure` and undergo HMAC SHA256 signature verification:
1. Header `X-Razorpay-Signature` is verified against `RAZORPAY_WEBHOOK_SECRET` using `hmac.compare_digest()`.
2. Timestamp freshness and replay store validation prevent replay attacks.
3. Event payloads (`payment.authorized`, `payment.failed`, `payment.captured`, `payment_link.paid`) are normalized via `RazorpayWebhookNormalizer` into internal `RecoveryEvent` objects.
4. `EventConsumerIdempotencyService` guarantees `(event_id, consumer_name)` uniqueness.

---

## Reconciliation & Safety Rules

- `ProviderStatus.SUCCESS` $\rightarrow$ Eligible for `RECOVERED` reconciliation.
- `ProviderStatus.FAILED` / `REJECTED` / `UNSUPPORTED` $\rightarrow$ `FAILED` / `STOPPED`.
- `ProviderStatus.UNKNOWN` / `TIMEOUT` / `AMBIGUOUS` $\rightarrow$ **NEVER** automatically `RECOVERED`. Automatically routes to `MANUAL_REVIEW` / `RECONCILIATION_REQUIRED`.
