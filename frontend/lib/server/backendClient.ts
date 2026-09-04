import {
  BackendOperationsMetricsResponse,
  BackendSystemHealthResponse,
  BackendProvidersResponse,
  BackendQueueStatusResponse,
  BackendWorkersResponse,
  BackendCircuitResponse,
  BackendRecoveryCasesResponse,
  BackendPaymentsResponse,
} from "../types/dashboard";

/**
 * Server-Side Backend Client
 * Executed SOLELY in Next.js Server / Node.js context (e.g. Route Handlers).
 * Keeps all API keys, operational credentials, and backend URLs on the server.
 */

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

async function fetchServerJson<T>(
  endpoint: string,
  includeAuth = false,
  timeoutMs = 4000
): Promise<{ data: T | null; error: string | null; status: number }> {
  const url = `${BACKEND_BASE_URL.replace(/\/+$/, "")}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

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

    if (!res.ok) {
      return {
        data: null,
        error: `HTTP ${res.status} ${res.statusText}`,
        status: res.status,
      };
    }

    const data = (await res.json()) as T;
    return { data, error: null, status: res.status };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : "Network request failed";
    return { data: null, error: msg, status: 0 };
  }
}

export interface RawBackendBundle {
  metrics: { data: BackendOperationsMetricsResponse | null; error: string | null };
  health: { data: BackendSystemHealthResponse | null; error: string | null };
  providers: { data: BackendProvidersResponse | null; error: string | null };
  queue: { data: BackendQueueStatusResponse | null; error: string | null };
  workers: { data: BackendWorkersResponse | null; error: string | null };
  circuit: { data: BackendCircuitResponse | null; error: string | null };
  cases: { data: BackendRecoveryCasesResponse | null; error: string | null };
  payments: { data: BackendPaymentsResponse | null; error: string | null };
  isBackendReachable: boolean;
}

export async function fetchRawBackendData(): Promise<RawBackendBundle> {
  const [
    metricsRes,
    healthRes,
    providersRes,
    queueRes,
    workersRes,
    circuitRes,
    casesRes,
    paymentsRes,
  ] = await Promise.allSettled([
    fetchServerJson<BackendOperationsMetricsResponse>("/api/v1/operations/metrics", true),
    fetchServerJson<BackendSystemHealthResponse>("/api/v1/operations/health", true),
    fetchServerJson<BackendProvidersResponse>("/api/v1/operations/providers", true),
    fetchServerJson<BackendQueueStatusResponse>("/api/v1/operations/queue/status", true),
    fetchServerJson<BackendWorkersResponse>("/api/v1/operations/workers", true),
    fetchServerJson<BackendCircuitResponse>("/api/v1/operations/providers/circuit", true),
    fetchServerJson<BackendRecoveryCasesResponse>("/api/v1/recovery/cases?limit=50", false),
    fetchServerJson<BackendPaymentsResponse>("/api/v1/payments?limit=50", false),
  ]);

  const metrics = metricsRes.status === "fulfilled" ? metricsRes.value : { data: null, error: "Rejected", status: 0 };
  const health = healthRes.status === "fulfilled" ? healthRes.value : { data: null, error: "Rejected", status: 0 };
  const providers = providersRes.status === "fulfilled" ? providersRes.value : { data: null, error: "Rejected", status: 0 };
  const queue = queueRes.status === "fulfilled" ? queueRes.value : { data: null, error: "Rejected", status: 0 };
  const workers = workersRes.status === "fulfilled" ? workersRes.value : { data: null, error: "Rejected", status: 0 };
  const circuit = circuitRes.status === "fulfilled" ? circuitRes.value : { data: null, error: "Rejected", status: 0 };
  const cases = casesRes.status === "fulfilled" ? casesRes.value : { data: null, error: "Rejected", status: 0 };
  const payments = paymentsRes.status === "fulfilled" ? paymentsRes.value : { data: null, error: "Rejected", status: 0 };

  const isBackendReachable =
    metrics.data !== null ||
    health.data !== null ||
    cases.data !== null ||
    payments.data !== null;

  return {
    metrics,
    health,
    providers,
    queue,
    workers,
    circuit,
    cases,
    payments,
    isBackendReachable,
  };
}
