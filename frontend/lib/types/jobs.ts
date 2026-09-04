/**
 * RecoverFlow Jobs & Queue Operations Types
 */

export interface QueueStatus {
  queued: number;
  claimed: number;
  succeeded: number;
  failed: number;
  deadLetter: number;
  backpressureLevel: "NORMAL" | "ELEVATED" | "CRITICAL" | string;
  status: string;
}

export interface JobItem {
  jobId: string;
  caseId: string;
  paymentId: string;
  jobType: string;
  status: "QUEUED" | "CLAIMED" | "SUCCEEDED" | "FAILED" | "DEAD_LETTER" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  attemptNumber: number;
  maxAttempts: number;
  workerId?: string;
  provider?: string;
  availableAt?: string;
  claimedAt?: string;
  leaseExpiresAt?: string;
  createdAt: string;
  lastError?: string;
  correlationId?: string;
}

export interface WorkerItem {
  workerId: string;
  hostname: string;
  processId: number;
  status: "RUNNING" | "IDLE" | "DRAINING" | "DEAD" | string;
  startedAt?: string;
  lastHeartbeatAt?: string;
  capabilities: string[];
  version: string;
}

export interface JobsPageResponse {
  queueStatus: QueueStatus;
  jobs: JobItem[];
  workers: WorkerItem[];
  isLive: boolean;
}

export interface JobTimelineRecord {
  id: string;
  eventType: string;
  timestamp: string;
  title: string;
  description: string;
  status: "SUCCESS" | "FAILED" | "INFO" | "PENDING";
}

export interface JobDetailBundle {
  jobId: string;
  caseId: string;
  paymentId: string;
  jobType: string;
  status: "QUEUED" | "CLAIMED" | "SUCCEEDED" | "FAILED" | "DEAD_LETTER" | string;
  priority: string;
  attemptNumber: number;
  maxAttempts: number;
  workerId: string;
  workerHostname?: string;
  provider: string;
  availableAt?: string;
  claimedAt?: string;
  leaseExpiresAt?: string;
  createdAt: string;
  lastError?: string;
  correlationId?: string;
  timeline: JobTimelineRecord[];
  isLive: boolean;
}
