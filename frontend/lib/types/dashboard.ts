/**
 * RecoverFlow Dashboard Domain & API Contract Types
 * Strict typing reflecting backend /api/v1/* contracts and dashboard UI needs.
 */

// ==========================================
// 1. Backend Raw API Response Contracts
// ==========================================

export interface BackendOperationsMetricsResponse {
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
  is_sandbox_baseline?: boolean;
  data_source?: string;
  telemetry_snapshot?: Record<string, unknown>;
}

export interface BackendHealthComponent {
  name: string;
  status: string;
  message?: string;
  latency_ms?: number;
  metadata?: Record<string, unknown>;
}

export interface BackendSystemHealthResponse {
  overall_status: string;
  checked_at: string;
  components: BackendHealthComponent[];
}

export interface BackendProviderItem {
  provider_name: string;
  status: string;
  consecutive_failures: number;
  consecutive_successes: number;
  last_success_at?: string | null;
  last_failure_at?: string | null;
  last_error?: string | null;
}

export interface BackendProvidersResponse {
  providers: BackendProviderItem[];
}

export interface BackendQueueStatusResponse {
  status: string;
  queued: number;
  claimed: number;
  succeeded: number;
  failed: number;
  dead_letter: number;
  backpressure_level: string;
}

export interface BackendWorkerItem {
  worker_id: string;
  hostname: string;
  process_id: number;
  status: string;
  started_at?: string | null;
  last_heartbeat_at?: string | null;
  capabilities?: string | null;
  version?: string;
}

export interface BackendWorkersResponse {
  total: number;
  workers: BackendWorkerItem[];
}

export interface BackendCircuitResponse {
  status: string;
  circuit_state: string;
}

export interface BackendRecoveryCaseItem {
  case_id: string;
  payment_id: string;
  customer_id: string;
  customer_name?: string;
  amount: number;
  currency: string;
  failure_reason: string;
  state: string;
  attempt_count: number;
  priority: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BackendRecoveryCasesResponse {
  total: number;
  cases: BackendRecoveryCaseItem[];
}

export interface BackendPaymentItem {
  payment_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: string;
  failure_code?: string | null;
  provider?: string;
  created_at?: string | null;
}

export interface BackendPaymentsResponse {
  total: number;
  payments: BackendPaymentItem[];
}

// ==========================================
// 2. Normalized Dashboard Presentation Types
// ==========================================

export interface OperationsPulseMetric {
  label: string;
  value: string;
  subtext: string;
  isEmerald?: boolean;
  isCyan?: boolean;
  deltaIcon?: boolean;
}

export interface RecoveryHealthItem {
  label: string;
  count: string;
  pct: string;
  color: string;
}

export interface RecoveryHealthData {
  items: RecoveryHealthItem[];
  recoveryRate: string;
  totalCasesLabel: string;
  percentages: {
    recovered: number;
    active: number;
    failed: number;
    manualReview: number;
  };
}

export interface RevenueProtectionItem {
  label: string;
  amount: string;
  pct: string;
  color: string;
  desc: string;
}

export interface RevenueProtectionData {
  revenueAtRisk: string;
  revenueRecovered: string;
  protectionRate: string;
  recoveryPercentageLabel: string;
  breakdown: RevenueProtectionItem[];
  barWidths: {
    autonomous: string;
    dynamicLink: string;
    inFlight: string;
    terminalLoss: string;
  };
}

export interface FailureIntelligenceItem {
  rank: string;
  code: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  severityColor: string;
  count: number;
  pct: string;
  barWidth: string;
  recoverability: string;
}

export interface ActivityStreamItem {
  caseId: string;
  paymentId: string;
  failureCode: string;
  provider: string;
  amount: string;
  status: "RECOVERED" | "ACTIVE" | "MANUAL_REVIEW" | "QUEUED" | "FAILED";
  attempts: string;
  time: string;
}

export interface PerformanceChartPoint {
  date: string;
  attempts: number;
  recovered: number;
  rate: string;
}

export interface PerformanceTimeframes {
  "7D": PerformanceChartPoint[];
  "30D": PerformanceChartPoint[];
  "90D": PerformanceChartPoint[];
}

export interface PerformanceChartBundle {
  timeframes: PerformanceTimeframes;
  isHistoricalLive: boolean;
}

export interface TelemetryRailItem {
  label: string;
  value: string;
  subtext: string;
  status: "healthy" | "warning" | "error" | "neutral";
  isEmerald?: boolean;
  isCyan?: boolean;
}

export interface TelemetryRailData {
  provider: TelemetryRailItem;
  workers: TelemetryRailItem;
  queue: TelemetryRailItem;
  circuitBreaker: TelemetryRailItem;
  ledger: TelemetryRailItem;
}

export interface DashboardHeaderMeta {
  systemStatus: "OPERATIONAL" | "DEGRADED" | "MAINTENANCE";
  environmentLabel: string;
  serverRegion: string;
  providerGateway: string;
  circuitState: string;
  lastSyncedText?: string;
}

export type DataSourceStatus =
  | "LIVE"
  | "LIVE_DATABASE"
  | "SANDBOX_BASELINE"
  | "SANDBOX_SEED"
  | "EMPTY_DATABASE"
  | "PARTIAL_ERROR"
  | "UNAVAILABLE";

export interface DashboardDataBundle {
  sourceStatus: DataSourceStatus;
  dataSourceNotice?: string;
  headerMeta: DashboardHeaderMeta;
  pulseMetrics: OperationsPulseMetric[];
  performanceChart: PerformanceChartBundle;
  recoveryHealth: RecoveryHealthData;
  revenueProtection: RevenueProtectionData;
  failureIntelligence: FailureIntelligenceItem[];
  recentActivity: ActivityStreamItem[];
  telemetryRail: TelemetryRailData;
  lastUpdated: string;
}
