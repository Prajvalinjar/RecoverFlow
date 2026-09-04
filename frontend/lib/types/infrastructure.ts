/**
 * RecoverFlow Infrastructure Types: Providers, Workers & System Health
 */

export interface ProviderItem {
  providerId: string;
  providerName: string;
  displayName: string;
  environment: string;
  state: "AVAILABLE" | "DEGRADED" | "UNAVAILABLE" | "MISCONFIGURED" | "DISABLED" | string;
  enabled: boolean;
  capabilities: string[];
  circuitState: "CLOSED" | "HALF_OPEN" | "OPEN" | string;
  lastHealthCheck?: string;
  latencyMs?: number;
  gatewayEndpoint?: string;
  configSanitized?: Record<string, string | boolean | number>;
}

export interface ProvidersSummary {
  totalProviders: number;
  availableCount: number;
  degradedCount: number;
  unavailableCount: number;
  circuitState: string;
}

export interface ProvidersPageResponse {
  summary: ProvidersSummary;
  providers: ProviderItem[];
  isLive: boolean;
}

export interface WorkerDetailItem {
  workerId: string;
  hostname: string;
  processId: number;
  status: "RUNNING" | "IDLE" | "DRAINING" | "DEAD" | string;
  startedAt?: string;
  lastHeartbeatAt?: string;
  capabilities: string[];
  version: string;
  activeJobsCount: number;
  assignedQueue: string;
}

export interface WorkersSummary {
  totalWorkers: number;
  onlineCount: number;
  offlineCount: number;
  activeJobs: number;
}

export interface WorkersPageResponse {
  summary: WorkersSummary;
  workers: WorkerDetailItem[];
  isLive: boolean;
}

export interface HealthComponentItem {
  name: string;
  status: "OPERATIONAL" | "DEGRADED" | "DOWN";
  latencyMs?: number | null;
  detail: string;
  checkedAt: string;
}

export interface SystemHealthBundle {
  overallStatus: "OPERATIONAL" | "DEGRADED" | "DOWN";
  checkedAt: string;
  components: {
    api: HealthComponentItem;
    database: HealthComponentItem;
    queue: HealthComponentItem;
    workers: HealthComponentItem;
    providers: HealthComponentItem;
    circuit: HealthComponentItem;
  };
  metrics: {
    queueDepth: number;
    backpressureLevel: string;
    activeWorkers: number;
    totalWorkers: number;
    activeProvider: string;
    circuitState: string;
  };
  isLive: boolean;
}
