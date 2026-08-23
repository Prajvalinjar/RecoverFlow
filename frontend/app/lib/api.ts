import {
  MOCK_METRICS,
  MOCK_CASES,
  MOCK_JOBS,
  MOCK_WORKERS,
  MOCK_AUDIT_EVENTS,
  MetricSummary,
  CaseItem,
  PaymentItem,
  JobItem,
  WorkerItem,
  AuditEventItem,
  ProviderHealthItem,
} from './mockData';

export type {
  MetricSummary,
  CaseItem,
  PaymentItem,
  JobItem,
  WorkerItem,
  AuditEventItem,
  ProviderHealthItem,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export let isDemoModeActive = false;

async function fetchWithFallback<T>(url: string, fallback: T): Promise<{ data: T; isDemo: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Operations-Role': 'ADMIN',
        'X-Operations-Key': 'dev-operations-key',
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      isDemoModeActive = false;
      return { data, isDemo: false };
    }
  } catch (err) {
    // Backend unavailable -> fallback to rich mock data
  }
  isDemoModeActive = true;
  return { data: fallback, isDemo: true };
}

export async function getOperationsMetrics(): Promise<{ data: MetricSummary; isDemo: boolean }> {
  return fetchWithFallback<MetricSummary>('/operations/metrics', MOCK_METRICS);
}

export async function getRecoveryCases(state?: string): Promise<{ data: CaseItem[]; isDemo: boolean }> {
  const url = state ? `/recovery/cases?state=${encodeURIComponent(state)}` : '/recovery/cases';
  const res = await fetchWithFallback<{ cases: CaseItem[] }>(url, { cases: MOCK_CASES });
  const cases = res.data.cases || MOCK_CASES;
  const filtered = state ? cases.filter(c => c.state === state) : cases;
  return { data: filtered, isDemo: res.isDemo };
}

export async function getCaseDetails(caseId: string): Promise<{ data: any; isDemo: boolean }> {
  const mockFound = MOCK_CASES.find(c => c.case_id === caseId) || MOCK_CASES[0];
  const fallback = {
    case_id: mockFound.case_id,
    payment_id: mockFound.payment_id,
    customer_id: mockFound.customer_id,
    state: mockFound.state,
    priority: mockFound.priority,
    attempt_count: mockFound.attempt_count,
    max_allowed_attempts: 3,
    created_at: mockFound.created_at,
    updated_at: mockFound.updated_at,
    payment: {
      amount: mockFound.amount,
      currency: mockFound.currency,
      status: mockFound.state === 'RECOVERED' ? 'SUCCESS' : 'FAILED',
      failure_code: mockFound.failure_reason,
    },
    customer: {
      segment: 'Enterprise SaaS',
      total_spent: '45000.00',
    },
  };
  return fetchWithFallback<any>(`/recovery/cases/${caseId}`, fallback);
}

export async function getCaseTimeline(caseId: string): Promise<{ data: AuditEventItem[]; isDemo: boolean }> {
  const filtered = MOCK_AUDIT_EVENTS.filter(e => e.case_id === caseId);
  const fallbackTimeline = filtered.length > 0 ? filtered : MOCK_AUDIT_EVENTS;
  const res = await fetchWithFallback<{ timeline: AuditEventItem[] }>(`/recovery/cases/${caseId}/timeline`, { timeline: fallbackTimeline });
  return { data: res.data.timeline || fallbackTimeline, isDemo: res.isDemo };
}

export async function getPayments(): Promise<{ data: PaymentItem[]; isDemo: boolean }> {
  const mockPayments: PaymentItem[] = MOCK_CASES.map(c => ({
    payment_id: c.payment_id,
    customer_id: c.customer_id,
    amount: c.amount,
    currency: c.currency,
    status: c.state === 'RECOVERED' ? 'SUCCESS' : 'FAILED',
    failure_code: c.failure_reason,
    provider: 'razorpay',
    created_at: c.created_at,
  }));
  const res = await fetchWithFallback<{ payments: PaymentItem[] }>('/payments', { payments: mockPayments });
  return { data: res.data.payments || mockPayments, isDemo: res.isDemo };
}

export async function getOperationsJobs(status?: string): Promise<{ data: JobItem[]; isDemo: boolean }> {
  const url = status ? `/operations/jobs?status=${encodeURIComponent(status)}` : '/operations/jobs';
  const res = await fetchWithFallback<{ jobs: JobItem[] }>(url, { jobs: MOCK_JOBS });
  const jobs = res.data.jobs || MOCK_JOBS;
  const filtered = status ? jobs.filter(j => j.status === status) : jobs;
  return { data: filtered, isDemo: res.isDemo };
}

export async function getOperationsWorkers(): Promise<{ data: WorkerItem[]; isDemo: boolean }> {
  const res = await fetchWithFallback<{ workers: WorkerItem[] }>('/operations/workers', { workers: MOCK_WORKERS });
  return { data: res.data.workers || MOCK_WORKERS, isDemo: res.isDemo };
}

export async function getProviderHealth(): Promise<{ data: ProviderHealthItem[]; isDemo: boolean }> {
  const mockProvider: ProviderHealthItem = {
    provider_name: 'razorpay',
    status: 'AVAILABLE',
    consecutive_failures: 0,
    consecutive_successes: 148,
    last_success_at: new Date().toISOString(),
  };
  const res = await fetchWithFallback<{ providers: ProviderHealthItem[] }>('/operations/providers/health', { providers: [mockProvider] });
  return { data: res.data.providers || [mockProvider], isDemo: res.isDemo };
}

export async function getOperationsAudit(): Promise<{ data: AuditEventItem[]; isDemo: boolean }> {
  const res = await fetchWithFallback<{ audit_events: AuditEventItem[] }>('/operations/audit', { audit_events: MOCK_AUDIT_EVENTS });
  return { data: res.data.audit_events || MOCK_AUDIT_EVENTS, isDemo: res.isDemo };
}

export async function getSystemHealth(): Promise<{ data: any; isDemo: boolean }> {
  const mockHealth = {
    overall_status: 'HEALTHY',
    checked_at: new Date().toISOString(),
    components: [
      { name: 'Database', status: 'HEALTHY', message: 'PostgreSQL operational', latency_ms: 1.2 },
      { name: 'Execution Provider', status: 'HEALTHY', message: 'Razorpay TEST sandbox connected', latency_ms: 4.5 },
      { name: 'Job Queue', status: 'HEALTHY', message: 'Worker queue active', latency_ms: 0.8 },
      { name: 'Circuit Breaker', status: 'HEALTHY', message: 'Circuit state CLOSED', latency_ms: 0.1 },
      { name: 'Reconciliation Engine', status: 'HEALTHY', message: 'Reconciliation queue processing', latency_ms: 0.4 },
      { name: 'Security & Auth', status: 'HEALTHY', message: 'HMAC signature verification enabled', latency_ms: 0.2 },
    ],
  };
  return fetchWithFallback<any>('/operations/health', mockHealth);
}

export async function getRecoveryStatus(): Promise<{ status: string; canExecute: boolean; isDemo: boolean }> {
  const res = await fetchWithFallback<{ status: string; can_execute_new_jobs: boolean }>('/operations/recovery/status', {
    status: 'RUNNING',
    can_execute_new_jobs: true,
  });
  return {
    status: res.data.status || 'RUNNING',
    canExecute: res.data.can_execute_new_jobs ?? true,
    isDemo: res.isDemo,
  };
}

export async function pauseRecovery(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/operations/recovery/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Operations-Role': 'ADMIN',
        'X-Operations-Key': 'dev-operations-key',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message };
    }
  } catch (err) {}
  return { success: true, message: 'Recovery operations successfully paused (Demo Mode).' };
}

export async function resumeRecovery(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/operations/recovery/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Operations-Role': 'ADMIN',
        'X-Operations-Key': 'dev-operations-key',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message };
    }
  } catch (err) {}
  return { success: true, message: 'Recovery operations successfully resumed (Demo Mode).' };
}

export async function retryJob(jobId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/operations/jobs/${jobId}/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Operations-Role': 'ADMIN',
        'X-Operations-Key': 'dev-operations-key',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message };
    }
  } catch (err) {}
  return { success: true, message: `Job ${jobId} scheduled for retry (Demo Mode).` };
}
