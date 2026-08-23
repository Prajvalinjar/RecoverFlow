export interface MetricSummary {
  total_cases: number;
  active_cases: number;
  recovered_cases: number;
  failed_cases: number;
  escalated_cases: number;
  stopped_cases: number;
  revenue_at_risk: string;
  revenue_recovered: string;
  recovery_rate_percent: number;
  average_attempts: number;
  telemetry_snapshot?: any;
}

export interface CaseItem {
  case_id: string;
  payment_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  currency: string;
  failure_reason: string;
  state: 'ACTIVE' | 'RECOVERED' | 'FAILED' | 'ESCALATED' | 'STOPPED' | 'MANUAL_REVIEW';
  attempt_count: number;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentItem {
  payment_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: string;
  failure_code: string;
  provider: string;
  created_at: string;
}

export interface JobItem {
  job_id: string;
  case_id: string;
  payment_id?: string;
  job_type: string;
  status: 'QUEUED' | 'CLAIMED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'RETRY_SCHEDULED' | 'DEAD_LETTER' | 'CANCELLED';
  priority: string;
  attempt_number: number;
  max_attempts: number;
  available_at: string;
  lease_expires_at?: string;
  worker?: string;
  correlation_id: string;
  created_at: string;
  last_error?: string;
}

export interface WorkerItem {
  worker_id: string;
  hostname: string;
  process_id: number;
  status: 'RUNNING' | 'IDLE' | 'DRAINING' | 'DEGRADED';
  started_at: string;
  last_heartbeat_at: string;
  capabilities: string[];
  version: string;
}

export interface AuditEventItem {
  event_id: string;
  event_type: string;
  aggregate_id: string;
  case_id: string;
  correlation_id: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface ProviderHealthItem {
  provider_name: string;
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'MISCONFIGURED' | 'DISABLED';
  consecutive_failures: number;
  consecutive_successes: number;
  last_success_at: string;
  last_failure_at?: string;
  last_error?: string;
}

export const MOCK_METRICS: MetricSummary = {
  total_cases: 1240,
  active_cases: 142,
  recovered_cases: 890,
  failed_cases: 86,
  escalated_cases: 74,
  stopped_cases: 48,
  revenue_at_risk: "245680.50",
  revenue_recovered: "182450.00",
  recovery_rate_percent: 74.26,
  average_attempts: 1.84,
  telemetry_snapshot: {
    counters: {
      "recovery.cases.created": 1240,
      "recovery.executions.completed": 1120,
      "provider.razorpay.success": 950,
      "provider.razorpay.rate_limit": 2
    }
  }
};

export const MOCK_CASES: CaseItem[] = [
  {
    case_id: "case_rf_9901",
    payment_id: "pay_rzp_1001",
    customer_id: "cust_acme_01",
    customer_name: "Acme Corp",
    amount: 1250.00,
    currency: "USD",
    failure_reason: "BANK_TIMEOUT",
    state: "RECOVERED",
    attempt_count: 1,
    priority: "HIGH",
    created_at: "2026-08-23T11:30:00Z",
    updated_at: "2026-08-23T11:32:15Z",
  },
  {
    case_id: "case_rf_9902",
    payment_id: "pay_rzp_1002",
    customer_id: "cust_globex_02",
    customer_name: "Globex Logistics",
    amount: 3450.00,
    currency: "USD",
    failure_reason: "NETWORK_FAILURE",
    state: "ACTIVE",
    attempt_count: 2,
    priority: "HIGH",
    created_at: "2026-08-23T11:15:00Z",
    updated_at: "2026-08-23T11:28:40Z",
  },
  {
    case_id: "case_rf_9903",
    payment_id: "pay_rzp_1003",
    customer_id: "cust_soylent_03",
    customer_name: "Soylent Tech",
    amount: 890.00,
    currency: "USD",
    failure_reason: "INSUFFICIENT_FUNDS",
    state: "ACTIVE",
    attempt_count: 1,
    priority: "MEDIUM",
    created_at: "2026-08-23T10:45:00Z",
    updated_at: "2026-08-23T11:00:00Z",
  },
  {
    case_id: "case_rf_9904",
    payment_id: "pay_rzp_1004",
    customer_id: "cust_stark_04",
    customer_name: "Stark Industries",
    amount: 15400.00,
    currency: "USD",
    failure_reason: "CARD_DECLINED",
    state: "RECOVERED",
    attempt_count: 1,
    priority: "HIGH",
    created_at: "2026-08-23T10:00:00Z",
    updated_at: "2026-08-23T10:05:12Z",
  },
  {
    case_id: "case_rf_9905",
    payment_id: "pay_rzp_1005",
    customer_id: "cust_wayne_05",
    customer_name: "Wayne Enterprises",
    amount: 9800.00,
    currency: "USD",
    failure_reason: "AUTHENTICATION_FAILURE",
    state: "MANUAL_REVIEW",
    attempt_count: 3,
    priority: "HIGH",
    created_at: "2026-08-23T09:30:00Z",
    updated_at: "2026-08-23T09:45:00Z",
  },
  {
    case_id: "case_rf_9906",
    payment_id: "pay_rzp_1006",
    customer_id: "cust_cyber_06",
    customer_name: "Cyberdyne Systems",
    amount: 450.00,
    currency: "USD",
    failure_reason: "BANK_TIMEOUT",
    state: "FAILED",
    attempt_count: 3,
    priority: "LOW",
    created_at: "2026-08-23T08:20:00Z",
    updated_at: "2026-08-23T09:10:00Z",
  },
  {
    case_id: "case_rf_9907",
    payment_id: "pay_rzp_1007",
    customer_id: "cust_umbrella_07",
    customer_name: "Umbrella Bio",
    amount: 2750.00,
    currency: "USD",
    failure_reason: "INSUFFICIENT_FUNDS",
    state: "ESCALATED",
    attempt_count: 2,
    priority: "MEDIUM",
    created_at: "2026-08-23T07:15:00Z",
    updated_at: "2026-08-23T08:00:00Z",
  },
  {
    case_id: "case_rf_9908",
    payment_id: "pay_rzp_1008",
    customer_id: "cust_aperture_08",
    customer_name: "Aperture Science",
    amount: 620.00,
    currency: "USD",
    failure_reason: "EXPIRED_CARD",
    state: "STOPPED",
    attempt_count: 1,
    priority: "LOW",
    created_at: "2026-08-23T06:00:00Z",
    updated_at: "2026-08-23T06:15:00Z",
  }
];

export const MOCK_JOBS: JobItem[] = [
  {
    job_id: "job_rf_801",
    case_id: "case_rf_9902",
    payment_id: "pay_rzp_1002",
    job_type: "RETRY_AFTER_DELAY",
    status: "RUNNING",
    priority: "HIGH",
    attempt_number: 2,
    max_attempts: 3,
    available_at: "2026-08-23T11:28:00Z",
    lease_expires_at: "2026-08-23T11:33:00Z",
    worker: "worker-prod-01",
    correlation_id: "corr_rf_801_abc",
    created_at: "2026-08-23T11:15:00Z"
  },
  {
    job_id: "job_rf_802",
    case_id: "case_rf_9903",
    payment_id: "pay_rzp_1003",
    job_type: "SEND_PAYMENT_LINK",
    status: "QUEUED",
    priority: "MEDIUM",
    attempt_number: 1,
    max_attempts: 3,
    available_at: "2026-08-23T11:35:00Z",
    correlation_id: "corr_rf_802_def",
    created_at: "2026-08-23T10:45:00Z"
  },
  {
    job_id: "job_rf_803",
    case_id: "case_rf_9905",
    payment_id: "pay_rzp_1005",
    job_type: "ESCALATE_TO_MERCHANT",
    status: "DEAD_LETTER",
    priority: "HIGH",
    attempt_number: 3,
    max_attempts: 3,
    available_at: "2026-08-23T09:45:00Z",
    correlation_id: "corr_rf_803_ghi",
    created_at: "2026-08-23T09:30:00Z",
    last_error: "Max attempts reached without provider confirmation"
  },
  {
    job_id: "job_rf_804",
    case_id: "case_rf_9901",
    payment_id: "pay_rzp_1001",
    job_type: "RETRY_IMMEDIATE",
    status: "SUCCEEDED",
    priority: "HIGH",
    attempt_number: 1,
    max_attempts: 3,
    available_at: "2026-08-23T11:30:00Z",
    worker: "worker-prod-02",
    correlation_id: "corr_rf_804_jkl",
    created_at: "2026-08-23T11:30:00Z"
  }
];

export const MOCK_WORKERS: WorkerItem[] = [
  {
    worker_id: "worker-prod-01",
    hostname: "rf-worker-node-us-east-1a",
    process_id: 14820,
    status: "RUNNING",
    started_at: "2026-08-23T00:00:00Z",
    last_heartbeat_at: "2026-08-23T11:32:00Z",
    capabilities: ["SEND_PAYMENT_LINK", "RETRY_IMMEDIATE", "RETRY_AFTER_DELAY"],
    version: "1.0.0"
  },
  {
    worker_id: "worker-prod-02",
    hostname: "rf-worker-node-us-east-1b",
    process_id: 14821,
    status: "RUNNING",
    started_at: "2026-08-23T00:00:00Z",
    last_heartbeat_at: "2026-08-23T11:32:05Z",
    capabilities: ["SEND_PAYMENT_LINK", "RETRY_IMMEDIATE", "ESCALATE_TO_MERCHANT"],
    version: "1.0.0"
  },
  {
    worker_id: "worker-prod-03",
    hostname: "rf-worker-node-us-east-1c",
    process_id: 14822,
    status: "IDLE",
    started_at: "2026-08-23T00:00:00Z",
    last_heartbeat_at: "2026-08-23T11:31:50Z",
    capabilities: ["SEND_PAYMENT_LINK", "RETRY_AFTER_DELAY"],
    version: "1.0.0"
  }
];

export const MOCK_AUDIT_EVENTS: AuditEventItem[] = [
  {
    event_id: "aud_9001",
    event_type: "CASE_DETECTED",
    aggregate_id: "case_rf_9901",
    case_id: "case_rf_9901",
    correlation_id: "corr_rf_804_jkl",
    timestamp: "2026-08-23T11:30:00Z",
    details: { payment_id: "pay_rzp_1001", amount: 1250.0, failure_code: "BANK_TIMEOUT" }
  },
  {
    event_id: "aud_9002",
    event_type: "AI_RECOMMENDATION_GENERATED",
    aggregate_id: "case_rf_9901",
    case_id: "case_rf_9901",
    correlation_id: "corr_rf_804_jkl",
    timestamp: "2026-08-23T11:30:02Z",
    details: { recommended_action: "RETRY_IMMEDIATE", confidence_score: 0.94, reasoning: "Transient bank timeout detected" }
  },
  {
    event_id: "aud_9003",
    event_type: "POLICY_EVALUATED",
    aggregate_id: "case_rf_9901",
    case_id: "case_rf_9901",
    correlation_id: "corr_rf_804_jkl",
    timestamp: "2026-08-23T11:30:03Z",
    details: { policy_name: "DeterministicRecoveryPolicyV1", decision: "APPROVED", action: "RETRY_IMMEDIATE" }
  },
  {
    event_id: "aud_9004",
    event_type: "EXECUTION_STARTED",
    aggregate_id: "case_rf_9901",
    case_id: "case_rf_9901",
    correlation_id: "corr_rf_804_jkl",
    timestamp: "2026-08-23T11:30:05Z",
    details: { provider: "razorpay", operation: "create_payment_link", idempotency_key: "ik_rf_9901_01" }
  },
  {
    event_id: "aud_9005",
    event_type: "EXECUTION_COMPLETED",
    aggregate_id: "case_rf_9901",
    case_id: "case_rf_9901",
    correlation_id: "corr_rf_804_jkl",
    timestamp: "2026-08-23T11:32:15Z",
    details: { provider: "razorpay", status: "COMPLETED", provider_reference: "plink_rzp_1001" }
  },
  {
    event_id: "aud_9006",
    event_type: "RECONCILIATION_CONFIRMED",
    aggregate_id: "case_rf_9901",
    case_id: "case_rf_9901",
    correlation_id: "corr_rf_804_jkl",
    timestamp: "2026-08-23T11:32:16Z",
    details: { outcome_status: "RECOVERED", recovered_amount: 1250.0 }
  }
];
