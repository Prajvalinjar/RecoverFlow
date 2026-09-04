export type RecoverySystemStatus = "RUNNING" | "PAUSED" | "STOPPED" | "DRAINING";

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export type BackpressureLevel = "NORMAL" | "ELEVATED" | "CRITICAL";

export interface RecoveryExecutionState {
  status: RecoverySystemStatus;
  canExecuteNewJobs: boolean;
  lastStateChange?: string;
  changedBy?: string;
  reason?: string;
}

export interface CircuitStateDetail {
  state: CircuitBreakerState;
  failureThreshold: number;
  recoveryTimeoutSeconds: number;
  probeQuota: number;
  isControlled: false; // Backend is strictly READ-ONLY
  unexposedReason: string;
}

export interface ProviderControlState {
  activeProvider: string;
  availableProviders: string[];
  configSanitized: Record<string, unknown>;
  isControlled: false; // Backend does NOT expose provider enable/disable
  unexposedReason: string;
}

export interface QueueControlState {
  status: string;
  queuedDepth: number;
  claimedLeases: number;
  succeeded: number;
  failed: number;
  deadLetter: number;
  backpressureLevel: BackpressureLevel;
  reconciliationSupported: true;
  lifecycleControlled: false; // pause/drain/clear queue NOT exposed
}

export interface WorkerControlSummary {
  onlineCount: number;
  totalWorkers: number;
  activeJobs: number;
  lifecycleControlled: false; // restart/stop worker NOT exposed
}

export interface OperationalSafeguardItem {
  id: string;
  name: string;
  status: "ACTIVE" | "ENFORCED" | "MONITORED";
  type: "CIRCUIT_BREAKER" | "RETRY_CAP" | "IDEMPOTENCY" | "BACKPRESSURE" | "LEASE_TIMEOUT" | "PROVIDER_ISOLATION";
  rule: string;
  enforcement: "AUTOMATIC" | "POLICY_ENGINE";
  description: string;
}

export interface OperationalControlEvent {
  eventId: string;
  timestamp: string;
  action: string;
  actor: string;
  result: "SUCCESS" | "FAILED" | "REJECTED";
  target: string;
  correlationId: string;
  details?: Record<string, unknown>;
}

export interface OperationsOverviewBundle {
  recovery: RecoveryExecutionState;
  circuit: CircuitStateDetail;
  providers: ProviderControlState;
  queue: QueueControlState;
  workers: WorkerControlSummary;
  safeguards: OperationalSafeguardItem[];
  recentEvents: OperationalControlEvent[];
  isLive: boolean;
  checkedAt: string;
}

export type SupportedControlAction =
  | "PAUSE_RECOVERY"
  | "RESUME_RECOVERY"
  | "RECONCILE_QUEUE";

export interface ControlActionRequest {
  action: SupportedControlAction;
}

export interface ControlActionResponse {
  status: "SUCCESS" | "FAILED";
  action: SupportedControlAction;
  message: string;
  confirmedState?: string;
  timestamp: string;
  correlationId?: string;
  error?: string;
}
