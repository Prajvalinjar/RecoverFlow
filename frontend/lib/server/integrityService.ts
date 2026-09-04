import {
  ReconciliationItem,
  ReconciliationPageResponse,
  AuditEventItem,
  AuditPageResponse,
} from "../types/integrity";
import { fetchCasesList } from "./casesService";
import { fetchPaymentsList } from "./paymentsService";

const BACKEND_BASE_URL =
  process.env.RECOVERFLOW_BACKEND_URL ||
  process.env.BACKEND_API_URL ||
  "http://127.0.0.1:8000";

const OPERATIONS_API_KEY =
  process.env.RECOVERFLOW_OPERATIONS_KEY ||
  process.env.OPERATIONS_KEY ||
  "dev_ops_secret_key";

const OPERATIONS_ROLE =
  process.env.RECOVERFLOW_OPERATIONS_ROLE || "ADMIN";

// Sandbox Baseline Reconciliation Dataset (Correlated with Payments, Cases & Jobs)
const SANDBOX_RECONCILIATION: ReconciliationItem[] = [
  {
    reconciliationId: "rec_9812_01",
    paymentId: "pay_9xM8k21Lm",
    caseId: "CASE-2026-9812",
    jobId: "job_9812_01",
    provider: "Razorpay Gateway",
    expectedAmount: 14850.0,
    actualAmount: 14850.0,
    currency: "USD",
    status: "MATCHED",
    discrepancy: 0.0,
    reconciledAt: "2026-08-25T14:12:19.000Z",
    ledgerEntryId: "ledger_entry_009812",
    notes: "Full gross amount confirmed by acquiring switch and balanced with event ledger.",
  },
  {
    reconciliationId: "rec_9811_01",
    paymentId: "pay_7vP31q82B",
    caseId: "CASE-2026-9811",
    jobId: "job_9811_01",
    provider: "Razorpay Gateway",
    expectedAmount: 4290.0,
    actualAmount: 0.0,
    currency: "USD",
    status: "PENDING",
    discrepancy: 4290.0,
    reconciledAt: "2026-08-25T14:04:12.000Z",
    ledgerEntryId: "ledger_entry_009811",
    notes: "Active recovery cycle in-flight. Awaiting provider execution confirmation.",
  },
  {
    reconciliationId: "rec_9810_01",
    paymentId: "pay_4nL52k91Z",
    caseId: "CASE-2026-9810",
    jobId: "job_9810_01",
    provider: "Razorpay Gateway",
    expectedAmount: 28400.0,
    actualAmount: 0.0,
    currency: "USD",
    status: "EXCEPTION",
    discrepancy: 28400.0,
    reconciledAt: "2026-08-25T13:58:20.000Z",
    ledgerEntryId: "ledger_entry_009810",
    notes: "Authentication failed threshold limits. Routed to manual review by policy engine.",
  },
  {
    reconciliationId: "rec_9809_01",
    paymentId: "pay_1mQ84v29C",
    caseId: "CASE-2026-9809",
    jobId: "job_9809_01",
    provider: "Razorpay Gateway",
    expectedAmount: 1820.0,
    actualAmount: 1820.0,
    currency: "USD",
    status: "MATCHED",
    discrepancy: 0.0,
    reconciledAt: "2026-08-25T13:43:12.000Z",
    ledgerEntryId: "ledger_entry_009809",
    notes: "100% principal recovered on attempt 1. Ledger reconciled.",
  },
  {
    reconciliationId: "rec_9808_01",
    paymentId: "pay_8kR29p41D",
    caseId: "CASE-2026-9808",
    jobId: "job_9808_01",
    provider: "Razorpay Gateway",
    expectedAmount: 9450.0,
    actualAmount: 0.0,
    currency: "USD",
    status: "PENDING",
    discrepancy: 9450.0,
    reconciledAt: "2026-08-25T13:35:10.000Z",
    ledgerEntryId: "ledger_entry_009808",
    notes: "Enqueued in recovery queue with high priority.",
  },
  {
    reconciliationId: "rec_9807_01",
    paymentId: "pay_3xZ18m72A",
    caseId: "CASE-2026-9807",
    jobId: "job_9807_01",
    provider: "Razorpay Gateway",
    expectedAmount: 6180.0,
    actualAmount: 0.0,
    currency: "USD",
    status: "UNMATCHED",
    discrepancy: 6180.0,
    reconciledAt: "2026-08-25T13:20:00.000Z",
    ledgerEntryId: "ledger_entry_009807",
    notes: "Permanent decline code returned by issuing bank. Unrecoverable.",
  },
  {
    reconciliationId: "rec_sec_001",
    paymentId: "pay_sec_verify_001",
    caseId: "case_pay_sec_verify_001",
    jobId: "job_sec_001",
    provider: "Razorpay Sandbox",
    expectedAmount: 2500.0,
    actualAmount: 2500.0,
    currency: "INR",
    status: "MATCHED",
    discrepancy: 0.0,
    reconciledAt: "2026-08-22T19:01:30.000Z",
    ledgerEntryId: "ledger_entry_sec001",
    notes: "Reconciliation verified via cryptographic HMAC webhook settlement.",
  },
  {
    reconciliationId: "rec_replay_001",
    paymentId: "pay_replay_001",
    caseId: "case_pay_replay_001",
    jobId: "job_replay_001",
    provider: "Razorpay Sandbox",
    expectedAmount: 1500.0,
    actualAmount: 1500.0,
    currency: "INR",
    status: "MATCHED",
    discrepancy: 0.0,
    reconciledAt: "2026-08-22T14:40:15.000Z",
    ledgerEntryId: "ledger_entry_rep001",
    notes: "Reconciliation confirmed with zero idempotency collisions.",
  },
  {
    reconciliationId: "rec_demo_1h",
    paymentId: "pay_demo_1h",
    caseId: "case_pay_demo_1h",
    jobId: "job_demo_1h",
    provider: "Razorpay Sandbox",
    expectedAmount: 4999.0,
    actualAmount: 4999.0,
    currency: "INR",
    status: "MATCHED",
    discrepancy: 0.0,
    reconciledAt: "2026-08-22T14:22:00.000Z",
    ledgerEntryId: "ledger_entry_demo1h",
    notes: "Reconciliation verified against test gateway response.",
  },
  {
    reconciliationId: "rec_demo_1g",
    paymentId: "pay_demo_1g",
    caseId: "case_pay_demo_1g",
    jobId: "job_demo_1g",
    provider: "Razorpay Sandbox",
    expectedAmount: 4999.0,
    actualAmount: 4999.0,
    currency: "INR",
    status: "MATCHED",
    discrepancy: 0.0,
    reconciledAt: "2026-08-22T14:10:00.000Z",
    ledgerEntryId: "ledger_entry_demo1g",
    notes: "Reconciliation verified against test gateway response.",
  },
];

// Sandbox Baseline Audit Dataset
const SANDBOX_AUDIT_EVENTS: AuditEventItem[] = [
  {
    eventId: "evt_aud_9812_04",
    eventType: "EXECUTION_RECONCILED",
    entityType: "RECOVERY",
    entityId: "CASE-2026-9812",
    actor: "RecoveryReconciliationService",
    status: "SUCCESS",
    timestamp: "2026-08-25T14:12:19.000Z",
    correlationId: "corr_9812_rec",
    caseId: "CASE-2026-9812",
    paymentId: "pay_9xM8k21Lm",
    jobId: "job_9812_01",
    payload: {
      action: "RECONCILE_PAYMENT",
      gross_amount: 14850.0,
      currency: "USD",
      reconciled_status: "MATCHED",
      provider: "Razorpay Gateway",
    },
  },
  {
    eventId: "evt_aud_9812_03",
    eventType: "EXECUTION_COMPLETED",
    entityType: "EXECUTION",
    entityId: "job_9812_01",
    actor: "worker_node_01",
    status: "SUCCESS",
    timestamp: "2026-08-25T14:09:45.000Z",
    correlationId: "corr_9812_rec",
    caseId: "CASE-2026-9812",
    paymentId: "pay_9xM8k21Lm",
    jobId: "job_9812_01",
    payload: {
      attempt: 2,
      max_attempts: 3,
      latency_ms: 142,
      idempotency_key: "idem_rec_9812_att_2",
      gateway_status: "captured",
    },
  },
  {
    eventId: "evt_aud_9812_02",
    eventType: "POLICY_EVALUATED",
    entityType: "POLICY",
    entityId: "pol_dec_9812",
    actor: "DeterministicPolicyEngine",
    status: "SUCCESS",
    timestamp: "2026-08-25T14:08:39.000Z",
    correlationId: "corr_9812_rec",
    caseId: "CASE-2026-9812",
    paymentId: "pay_9xM8k21Lm",
    payload: {
      rule: "BANK_TIMEOUT_SMART_RETRY",
      action: "SCHEDULE_RETRY",
      retry_delay_seconds: 180,
      ai_advisory_considered: "OPTIMAL_WINDOW_180S",
      execution_authority: "100% DETERMINISTIC POLICY",
    },
  },
  {
    eventId: "evt_aud_9812_01",
    eventType: "PAYMENT_FAILURE_INGESTED",
    entityType: "PAYMENT",
    entityId: "pay_9xM8k21Lm",
    actor: "WebhookIngestionService",
    status: "INFO",
    timestamp: "2026-08-25T14:08:37.000Z",
    correlationId: "corr_9812_rec",
    caseId: "CASE-2026-9812",
    paymentId: "pay_9xM8k21Lm",
    payload: {
      failure_code: "BANK_TIMEOUT",
      amount: 14850.0,
      currency: "USD",
      hmac_verified: true,
    },
  },
  {
    eventId: "evt_aud_9810_02",
    eventType: "POLICY_ESCALATED_MANUAL_REVIEW",
    entityType: "POLICY",
    entityId: "pol_dec_9810",
    actor: "DeterministicPolicyEngine",
    status: "FAILED",
    timestamp: "2026-08-25T13:58:22.000Z",
    correlationId: "corr_9810_escalate",
    caseId: "CASE-2026-9810",
    paymentId: "pay_4nL52k91Z",
    jobId: "job_9810_01",
    payload: {
      failure_code: "AUTHENTICATION_FAILURE",
      reason: "SCA Step-up validation rejected by cardholder bank",
      action: "REQUIRE_OPERATOR_REVIEW",
    },
  },
  {
    eventId: "evt_aud_9809_01",
    eventType: "EXECUTION_RECONCILED",
    entityType: "RECOVERY",
    entityId: "CASE-2026-9809",
    actor: "RecoveryReconciliationService",
    status: "SUCCESS",
    timestamp: "2026-08-25T13:43:12.000Z",
    correlationId: "corr_9809_succ",
    caseId: "CASE-2026-9809",
    paymentId: "pay_1mQ84v29C",
    jobId: "job_9809_01",
    payload: {
      amount: 1820.0,
      currency: "USD",
      reconciled: true,
    },
  },
  {
    eventId: "evt_aud_sec_01",
    eventType: "EXECUTION_RECONCILED",
    entityType: "RECOVERY",
    entityId: "case_pay_sec_verify_001",
    actor: "RecoveryReconciliationService",
    status: "SUCCESS",
    timestamp: "2026-08-22T19:01:30.000Z",
    correlationId: "corr_sec_001",
    caseId: "case_pay_sec_verify_001",
    paymentId: "pay_sec_verify_001",
    jobId: "job_sec_001",
    payload: {
      amount: 2500.0,
      currency: "INR",
      reconciled: true,
      channel: "UPI_SWITCH",
    },
  },
];

async function fetchBackendJson<T>(endpoint: string): Promise<T | null> {
  const url = `${BACKEND_BASE_URL.replace(/\/+$/, "")}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Operations-Key": OPERATIONS_API_KEY,
    "X-Operations-Role": OPERATIONS_ROLE,
  };

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

// 1. RECONCILIATION
export async function fetchReconciliationList(): Promise<ReconciliationPageResponse> {
  const [casesData, paymentsData] = await Promise.all([
    fetchCasesList(),
    fetchPaymentsList(),
  ]);

  // If live data exists, map to reconciliation records
  if (casesData.isLive || paymentsData.isLive) {
    const records: ReconciliationItem[] = casesData.cases.map((c, idx) => {
      const isRecovered = c.state === "RECOVERED";
      const isPending = c.state === "ACTIVE" || c.state === "QUEUED";
      const isManual = c.state === "MANUAL_REVIEW";
      const status = isRecovered
        ? "MATCHED"
        : isPending
        ? "PENDING"
        : isManual
        ? "EXCEPTION"
        : "UNMATCHED";

      const actual = isRecovered ? c.amount : 0;
      const discrepancy = isRecovered ? 0 : c.amount;

      return {
        reconciliationId: `rec_${c.caseId.replace(/[^a-zA-Z0-9]/g, "_")}_${idx + 1}`,
        paymentId: c.paymentId || `pay_${c.caseId.slice(-6)}`,
        caseId: c.caseId,
        jobId: `job_${c.caseId.slice(-6)}_01`,
        provider: "Razorpay Gateway",
        expectedAmount: c.amount,
        actualAmount: actual,
        currency: c.currency,
        status,
        discrepancy,
        reconciledAt: c.updatedAt || c.createdAt,
        ledgerEntryId: `ledger_entry_${c.caseId.slice(-6)}`,
        notes: isRecovered
          ? "Full gross amount matched and settled with event ledger."
          : isPending
          ? "Recovery cycle currently pending execution."
          : isManual
          ? "Manual review required by policy engine."
          : "Terminal failure; amount could not be recovered.",
      };
    });

    const currencyVolume: Record<string, number> = {};
    records.filter((r) => r.status === "MATCHED").forEach((r) => {
      currencyVolume[r.currency] = (currencyVolume[r.currency] || 0) + r.actualAmount;
    });

    return {
      summary: {
        totalRecords: records.length,
        matchedCount: records.filter((r) => r.status === "MATCHED").length,
        unmatchedCount: records.filter((r) => r.status === "UNMATCHED").length,
        pendingCount: records.filter((r) => r.status === "PENDING").length,
        exceptionCount: records.filter((r) => r.status === "EXCEPTION").length,
        reconciledVolumeByCurrency: currencyVolume,
      },
      records,
      isLive: true,
    };
  }

  // Fallback to Sandbox Baseline
  const currencyVolume: Record<string, number> = {};
  SANDBOX_RECONCILIATION.filter((r) => r.status === "MATCHED").forEach((r) => {
    currencyVolume[r.currency] = (currencyVolume[r.currency] || 0) + r.actualAmount;
  });

  return {
    summary: {
      totalRecords: SANDBOX_RECONCILIATION.length,
      matchedCount: SANDBOX_RECONCILIATION.filter((r) => r.status === "MATCHED").length,
      unmatchedCount: SANDBOX_RECONCILIATION.filter((r) => r.status === "UNMATCHED").length,
      pendingCount: SANDBOX_RECONCILIATION.filter((r) => r.status === "PENDING").length,
      exceptionCount: SANDBOX_RECONCILIATION.filter((r) => r.status === "EXCEPTION").length,
      reconciledVolumeByCurrency: currencyVolume,
    },
    records: SANDBOX_RECONCILIATION,
    isLive: false,
  };
}

export async function fetchReconciliationDetail(
  reconciliationId: string
): Promise<ReconciliationItem | null> {
  const { records } = await fetchReconciliationList();
  const rec = records.find(
    (r) => r.reconciliationId.toLowerCase() === reconciliationId.toLowerCase()
  );
  return rec || null;
}

// 2. AUDIT TRAIL
export async function fetchAuditList(): Promise<AuditPageResponse> {
  const eventsRes = await fetchBackendJson<{
    total: number;
    records: Array<{
      id: string;
      event_id: string;
      event_type: string;
      consumer_name: string;
      status: string;
      correlation_id?: string;
      processed_at?: string;
    }>;
  }>("/api/v1/operations/events");

  if (eventsRes && eventsRes.records && eventsRes.records.length > 0) {
    const mappedEvents: AuditEventItem[] = eventsRes.records.map((r) => ({
      eventId: r.id || r.event_id,
      eventType: r.event_type,
      entityType: "EVENT",
      entityId: r.event_id,
      actor: r.consumer_name || "EventConsumer",
      status: r.status === "PROCESSED" ? "SUCCESS" : "INFO",
      timestamp: r.processed_at || new Date().toISOString(),
      correlationId: r.correlation_id,
      payload: {
        event_id: r.event_id,
        event_type: r.event_type,
        consumer: r.consumer_name,
        status: r.status,
      },
    }));

    return {
      summary: {
        totalEvents: mappedEvents.length,
        recoveryEvents: mappedEvents.filter((e) => e.eventType.includes("RECOVERY")).length,
        policyEvents: mappedEvents.filter((e) => e.eventType.includes("POLICY")).length,
        executionEvents: mappedEvents.filter((e) => e.eventType.includes("EXECUTION")).length,
        errorEvents: mappedEvents.filter((e) => e.status === "FAILED").length,
      },
      events: mappedEvents,
      isLive: true,
    };
  }

  // Fallback to Sandbox Baseline
  return {
    summary: {
      totalEvents: SANDBOX_AUDIT_EVENTS.length,
      recoveryEvents: SANDBOX_AUDIT_EVENTS.filter((e) => e.entityType === "RECOVERY").length,
      policyEvents: SANDBOX_AUDIT_EVENTS.filter((e) => e.entityType === "POLICY").length,
      executionEvents: SANDBOX_AUDIT_EVENTS.filter((e) => e.entityType === "EXECUTION").length,
      errorEvents: SANDBOX_AUDIT_EVENTS.filter((e) => e.status === "FAILED").length,
    },
    events: SANDBOX_AUDIT_EVENTS,
    isLive: false,
  };
}

export async function fetchAuditDetail(eventId: string): Promise<AuditEventItem | null> {
  const { events } = await fetchAuditList();
  const evt = events.find(
    (e) => e.eventId.toLowerCase() === eventId.toLowerCase()
  );
  return evt || null;
}
