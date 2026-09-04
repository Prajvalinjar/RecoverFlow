import {
  PaymentItem,
  PaymentsListResponse,
  PaymentDetailBundle,
  PaymentTimelineRecord,
} from "../types/payments";
import { fetchCasesList } from "./casesService";

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

// Sandbox Baseline Payments Dataset (Directly correlated with Sandbox Cases)
const SANDBOX_PAYMENTS: PaymentItem[] = [
  {
    paymentId: "pay_9xM8k21Lm",
    customerId: "cust_usr_8912",
    customerName: "Acme Corp (Global)",
    amount: 14850.0,
    currency: "USD",
    status: "FAILED",
    failureCode: "BANK_TIMEOUT",
    failureReason: "Issuing bank network timeout during 3DS challenge",
    provider: "Razorpay Gateway",
    createdAt: "2026-08-25T14:08:37.000Z",
    updatedAt: "2026-08-25T14:12:19.000Z",
    caseId: "CASE-2026-9812",
    caseState: "RECOVERED",
  },
  {
    paymentId: "pay_7vP31q82B",
    customerId: "cust_usr_4402",
    customerName: "Starlight SaaS Ltd",
    amount: 4290.0,
    currency: "USD",
    status: "FAILED",
    failureCode: "NETWORK_FAILURE",
    failureReason: "Gateway upstream socket timeout",
    provider: "Razorpay Gateway",
    createdAt: "2026-08-25T14:04:12.000Z",
    updatedAt: "2026-08-25T14:05:00.000Z",
    caseId: "CASE-2026-9811",
    caseState: "ACTIVE",
  },
  {
    paymentId: "pay_4nL52k91Z",
    customerId: "cust_usr_9931",
    customerName: "Horizon Logistics Inc",
    amount: 28400.0,
    currency: "USD",
    status: "FAILED",
    failureCode: "AUTHENTICATION_FAILURE",
    failureReason: "SCA Step-up validation rejected by cardholder bank",
    provider: "Razorpay Gateway",
    createdAt: "2026-08-25T13:58:20.000Z",
    updatedAt: "2026-08-25T14:09:44.000Z",
    caseId: "CASE-2026-9810",
    caseState: "MANUAL_REVIEW",
  },
  {
    paymentId: "pay_1mQ84v29C",
    customerId: "cust_usr_1204",
    customerName: "Vortex Payments Lab",
    amount: 1820.0,
    currency: "USD",
    status: "FAILED",
    failureCode: "BANK_TIMEOUT",
    failureReason: "Issuer response latency threshold exceeded (>5000ms)",
    provider: "Razorpay Gateway",
    createdAt: "2026-08-25T13:41:00.000Z",
    updatedAt: "2026-08-25T13:43:12.000Z",
    caseId: "CASE-2026-9809",
    caseState: "RECOVERED",
  },
  {
    paymentId: "pay_8kR29p41D",
    customerId: "cust_usr_7721",
    customerName: "Apex Cloud Services",
    amount: 9450.0,
    currency: "USD",
    status: "FAILED",
    failureCode: "GATEWAY_DOWN",
    failureReason: "Acquiring switch returned HTTP 503 Service Unavailable",
    provider: "Razorpay Gateway",
    createdAt: "2026-08-25T13:35:10.000Z",
    updatedAt: "2026-08-25T13:35:10.000Z",
    caseId: "CASE-2026-9808",
    caseState: "QUEUED",
  },
  {
    paymentId: "pay_3xZ18m72A",
    customerId: "cust_usr_3189",
    customerName: "Nexus Digital Media",
    amount: 6180.0,
    currency: "USD",
    status: "FAILED",
    failureCode: "CARD_DECLINED",
    failureReason: "Permanent decline code: Do Not Honor",
    provider: "Razorpay Gateway",
    createdAt: "2026-08-25T13:20:00.000Z",
    updatedAt: "2026-08-25T13:32:45.000Z",
    caseId: "CASE-2026-9807",
    caseState: "FAILED",
  },
  {
    paymentId: "pay_sec_verify_001",
    customerId: "cust_sec_verify_001",
    customerName: "Secured Channel Verification",
    amount: 2500.0,
    currency: "INR",
    status: "FAILED",
    failureCode: "BANK_TIMEOUT",
    failureReason: "NPCI UPI Switch timeout",
    provider: "Razorpay Sandbox",
    createdAt: "2026-08-22T19:00:00.000Z",
    updatedAt: "2026-08-22T19:01:30.000Z",
    caseId: "case_pay_sec_verify_001",
    caseState: "RECOVERED",
  },
  {
    paymentId: "pay_replay_001",
    customerId: "cust_replay_001",
    customerName: "Replay Protection Test Customer",
    amount: 1500.0,
    currency: "INR",
    status: "FAILED",
    failureCode: "BANK_TIMEOUT",
    failureReason: "Payment gateway transient connection lost",
    provider: "Razorpay Sandbox",
    createdAt: "2026-08-22T14:38:21.000Z",
    updatedAt: "2026-08-22T14:40:15.000Z",
    caseId: "case_pay_replay_001",
    caseState: "RECOVERED",
  },
  {
    paymentId: "pay_demo_1h",
    customerId: "cust_demo_1h",
    customerName: "Demo Enterprise User 1H",
    amount: 4999.0,
    currency: "INR",
    status: "FAILED",
    failureCode: "BANK_TIMEOUT",
    failureReason: "Simulated bank switch latency timeout",
    provider: "Razorpay Sandbox",
    createdAt: "2026-08-22T14:20:19.000Z",
    updatedAt: "2026-08-22T14:22:00.000Z",
    caseId: "case_pay_demo_1h",
    caseState: "RECOVERED",
  },
  {
    paymentId: "pay_demo_1g",
    customerId: "cust_demo_1g",
    customerName: "Demo Enterprise User 1G",
    amount: 4999.0,
    currency: "INR",
    status: "FAILED",
    failureCode: "BANK_TIMEOUT",
    failureReason: "Simulated bank switch latency timeout",
    provider: "Razorpay Sandbox",
    createdAt: "2026-08-22T14:08:37.000Z",
    updatedAt: "2026-08-22T14:10:00.000Z",
    caseId: "case_pay_demo_1g",
    caseState: "RECOVERED",
  },
];

async function fetchBackendJson<T>(endpoint: string, includeAuth = false): Promise<T | null> {
  const url = `${BACKEND_BASE_URL.replace(/\/+$/, "")}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (includeAuth) {
    headers["X-Operations-Key"] = OPERATIONS_API_KEY;
    headers["X-Operations-Role"] = OPERATIONS_ROLE;
  }

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

export async function fetchPaymentsList(): Promise<PaymentsListResponse> {
  const [paymentsRes, casesData] = await Promise.all([
    fetchBackendJson<{ total: number; payments: Array<{ payment_id: string; customer_id: string; amount: number; currency: string; status: string; failure_code?: string; provider?: string; created_at?: string }> }>(
      "/api/v1/payments?limit=200",
      false
    ),
    fetchCasesList(),
  ]);

  // Build a lookup map of Payment ID -> Recovery Case
  const caseByPaymentId = new Map<string, { caseId: string; state: string }>();
  casesData.cases.forEach((c) => {
    if (c.paymentId) {
      caseByPaymentId.set(c.paymentId, { caseId: c.caseId, state: c.state });
    }
  });

  if (paymentsRes && paymentsRes.payments && paymentsRes.payments.length > 0) {
    const mappedPayments: PaymentItem[] = paymentsRes.payments.map((p) => {
      const linkedCase = caseByPaymentId.get(p.payment_id);
      return {
        paymentId: p.payment_id,
        customerId: p.customer_id,
        customerName: `Cust-${p.customer_id?.slice(-6) || "ID"}`,
        amount: typeof p.amount === "number" ? p.amount : parseFloat(String(p.amount || 0)),
        currency: p.currency || "USD",
        status: p.status || "FAILED",
        failureCode: p.failure_code || "BANK_TIMEOUT",
        failureReason: "Payment processing interrupted by gateway",
        provider: p.provider || "Razorpay Gateway",
        createdAt: p.created_at || new Date().toISOString(),
        caseId: linkedCase?.caseId || null,
        caseState: linkedCase?.state || null,
      };
    });

    const currencyVolume: Record<string, number> = {};
    mappedPayments.forEach((p) => {
      currencyVolume[p.currency] = (currencyVolume[p.currency] || 0) + p.amount;
    });

    return {
      summary: {
        totalPayments: mappedPayments.length,
        failedPayments: mappedPayments.filter((p) => p.status === "FAILED").length,
        recoveredPayments: mappedPayments.filter((p) => p.caseState === "RECOVERED").length,
        activeRecoveryPayments: mappedPayments.filter((p) => p.caseState === "ACTIVE" || p.caseState === "QUEUED").length,
        totalVolumeByCurrency: currencyVolume,
      },
      payments: mappedPayments,
      isLive: casesData.isLive,
    };
  }

  // Fallback to Sandbox Baseline
  const currencyVolume: Record<string, number> = {};
  SANDBOX_PAYMENTS.forEach((p) => {
    currencyVolume[p.currency] = (currencyVolume[p.currency] || 0) + p.amount;
  });

  return {
    summary: {
      totalPayments: SANDBOX_PAYMENTS.length,
      failedPayments: SANDBOX_PAYMENTS.filter((p) => p.status === "FAILED").length,
      recoveredPayments: SANDBOX_PAYMENTS.filter((p) => p.caseState === "RECOVERED").length,
      activeRecoveryPayments: SANDBOX_PAYMENTS.filter((p) => p.caseState === "ACTIVE" || p.caseState === "QUEUED").length,
      totalVolumeByCurrency: currencyVolume,
    },
    payments: SANDBOX_PAYMENTS,
    isLive: false,
  };
}

export async function fetchPaymentDetail(paymentId: string): Promise<PaymentDetailBundle | null> {
  const paymentsList = await fetchPaymentsList();
  const payment = paymentsList.payments.find(
    (p) => p.paymentId.toLowerCase() === paymentId.toLowerCase()
  );

  if (!payment) {
    return null;
  }

  const timeline: PaymentTimelineRecord[] = [
    {
      id: `evt_pay_created_${payment.paymentId}`,
      eventType: "PAYMENT_CREATED",
      timestamp: payment.createdAt,
      title: "Payment Transaction Initiated",
      description: `Payment intent generated for gross amount ${payment.amount} ${payment.currency}.`,
      status: "INFO",
    },
    {
      id: `evt_pay_failed_${payment.paymentId}`,
      eventType: "PAYMENT_FAILED",
      timestamp: payment.createdAt,
      title: `Payment Failed (${payment.failureCode || "UNKNOWN"})`,
      description: payment.failureReason || "Transaction declined by provider switch.",
      status: "FAILED",
    },
  ];

  if (payment.caseId) {
    timeline.push({
      id: `evt_case_linked_${payment.paymentId}`,
      eventType: "RECOVERY_CASE_LINKED",
      timestamp: payment.createdAt,
      title: "Recovery Case Ingested",
      description: `Recovery pipeline initialized case ${payment.caseId} with state ${payment.caseState || "ACTIVE"}.`,
      status: "INFO",
    });

    if (payment.caseState === "RECOVERED") {
      timeline.push({
        id: `evt_pay_recovered_${payment.paymentId}`,
        eventType: "PAYMENT_RECOVERED",
        timestamp: payment.updatedAt || payment.createdAt,
        title: "Autonomous Recovery Succeeded",
        description: "Payment captured idempotently via RecoverFlow policy execution.",
        status: "SUCCESS",
      });
    }
  }

  return {
    paymentId: payment.paymentId,
    customerId: payment.customerId,
    customerName: payment.customerName || `Cust-${payment.customerId.slice(-6)}`,
    customerSegment: "ENTERPRISE",
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    failureCode: payment.failureCode,
    failureReason: payment.failureReason,
    provider: payment.provider,
    providerReference: `rf_prov_ref_${payment.paymentId.slice(-8)}`,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    caseId: payment.caseId,
    caseState: payment.caseState,
    caseAttemptCount: payment.caseState === "RECOVERED" ? 2 : 1,
    caseMaxAttempts: 3,
    timeline,
    isLive: paymentsList.isLive,
  };
}
