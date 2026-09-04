import {
  JobItem,
  WorkerItem,
  QueueStatus,
  JobsPageResponse,
  JobDetailBundle,
  JobTimelineRecord,
} from "../types/jobs";

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

// Sandbox Baseline Jobs Dataset (Correlated with Sandbox Cases & Payments)
const SANDBOX_JOBS: JobItem[] = [
  {
    jobId: "job_9812_01",
    caseId: "CASE-2026-9812",
    paymentId: "pay_9xM8k21Lm",
    jobType: "RECOVERY_CYCLE",
    status: "SUCCEEDED",
    priority: "HIGH",
    attemptNumber: 2,
    maxAttempts: 3,
    workerId: "worker_node_01",
    provider: "Razorpay Gateway",
    availableAt: "2026-08-25T14:08:37.000Z",
    claimedAt: "2026-08-25T14:08:38.000Z",
    leaseExpiresAt: "2026-08-25T14:09:38.000Z",
    createdAt: "2026-08-25T14:08:37.000Z",
    correlationId: "corr_9812_rec",
  },
  {
    jobId: "job_9811_01",
    caseId: "CASE-2026-9811",
    paymentId: "pay_7vP31q82B",
    jobType: "RECOVERY_CYCLE",
    status: "CLAIMED",
    priority: "MEDIUM",
    attemptNumber: 1,
    maxAttempts: 3,
    workerId: "worker_node_03",
    provider: "Razorpay Gateway",
    availableAt: "2026-08-25T14:04:12.000Z",
    claimedAt: "2026-08-25T14:04:15.000Z",
    leaseExpiresAt: "2026-08-25T14:05:15.000Z",
    createdAt: "2026-08-25T14:04:12.000Z",
    correlationId: "corr_9811_active",
  },
  {
    jobId: "job_9810_01",
    caseId: "CASE-2026-9810",
    paymentId: "pay_4nL52k91Z",
    jobType: "RETRY",
    status: "FAILED",
    priority: "CRITICAL",
    attemptNumber: 3,
    maxAttempts: 3,
    workerId: "worker_node_02",
    provider: "Razorpay Gateway",
    availableAt: "2026-08-25T13:58:20.000Z",
    claimedAt: "2026-08-25T13:58:22.000Z",
    leaseExpiresAt: "2026-08-25T13:59:22.000Z",
    createdAt: "2026-08-25T13:58:20.000Z",
    lastError: "Authentication step-up rejected by cardholder bank",
    correlationId: "corr_9810_escalate",
  },
  {
    jobId: "job_9809_01",
    caseId: "CASE-2026-9809",
    paymentId: "pay_1mQ84v29C",
    jobType: "RECOVERY_CYCLE",
    status: "SUCCEEDED",
    priority: "LOW",
    attemptNumber: 1,
    maxAttempts: 3,
    workerId: "worker_node_04",
    provider: "Razorpay Gateway",
    availableAt: "2026-08-25T13:41:00.000Z",
    claimedAt: "2026-08-25T13:41:02.000Z",
    leaseExpiresAt: "2026-08-25T13:42:02.000Z",
    createdAt: "2026-08-25T13:41:00.000Z",
    correlationId: "corr_9809_succ",
  },
  {
    jobId: "job_9808_01",
    caseId: "CASE-2026-9808",
    paymentId: "pay_8kR29p41D",
    jobType: "RETRY",
    status: "QUEUED",
    priority: "HIGH",
    attemptNumber: 0,
    maxAttempts: 3,
    provider: "Razorpay Gateway",
    availableAt: "2026-08-25T13:35:10.000Z",
    createdAt: "2026-08-25T13:35:10.000Z",
    correlationId: "corr_9808_queued",
  },
  {
    jobId: "job_9807_01",
    caseId: "CASE-2026-9807",
    paymentId: "pay_3xZ18m72A",
    jobType: "RECOVERY_CYCLE",
    status: "DEAD_LETTER",
    priority: "HIGH",
    attemptNumber: 3,
    maxAttempts: 3,
    workerId: "worker_node_01",
    provider: "Razorpay Gateway",
    availableAt: "2026-08-25T13:20:00.000Z",
    claimedAt: "2026-08-25T13:20:05.000Z",
    leaseExpiresAt: "2026-08-25T13:21:05.000Z",
    createdAt: "2026-08-25T13:20:00.000Z",
    lastError: "Card permanently declined by issuer (Do Not Honor)",
    correlationId: "corr_9807_dead",
  },
  {
    jobId: "job_sec_001",
    caseId: "case_pay_sec_verify_001",
    paymentId: "pay_sec_verify_001",
    jobType: "RECOVERY_CYCLE",
    status: "SUCCEEDED",
    priority: "MEDIUM",
    attemptNumber: 1,
    maxAttempts: 3,
    workerId: "worker_node_02",
    provider: "Razorpay Sandbox",
    availableAt: "2026-08-22T19:00:00.000Z",
    claimedAt: "2026-08-22T19:00:02.000Z",
    leaseExpiresAt: "2026-08-22T19:01:02.000Z",
    createdAt: "2026-08-22T19:00:00.000Z",
    correlationId: "corr_sec_001",
  },
  {
    jobId: "job_replay_001",
    caseId: "case_pay_replay_001",
    paymentId: "pay_replay_001",
    jobType: "RECOVERY_CYCLE",
    status: "SUCCEEDED",
    priority: "MEDIUM",
    attemptNumber: 1,
    maxAttempts: 3,
    workerId: "worker_node_03",
    provider: "Razorpay Sandbox",
    availableAt: "2026-08-22T14:38:21.000Z",
    claimedAt: "2026-08-22T14:38:23.000Z",
    leaseExpiresAt: "2026-08-22T14:39:23.000Z",
    createdAt: "2026-08-22T14:38:21.000Z",
    correlationId: "corr_replay_001",
  },
  {
    jobId: "job_demo_1h",
    caseId: "case_pay_demo_1h",
    paymentId: "pay_demo_1h",
    jobType: "RECOVERY_CYCLE",
    status: "SUCCEEDED",
    priority: "MEDIUM",
    attemptNumber: 1,
    maxAttempts: 3,
    workerId: "worker_node_04",
    provider: "Razorpay Sandbox",
    availableAt: "2026-08-22T14:20:19.000Z",
    claimedAt: "2026-08-22T14:20:20.000Z",
    leaseExpiresAt: "2026-08-22T14:21:20.000Z",
    createdAt: "2026-08-22T14:20:19.000Z",
    correlationId: "corr_demo_1h",
  },
  {
    jobId: "job_demo_1g",
    caseId: "case_pay_demo_1g",
    paymentId: "pay_demo_1g",
    jobType: "RECOVERY_CYCLE",
    status: "SUCCEEDED",
    priority: "MEDIUM",
    attemptNumber: 1,
    maxAttempts: 3,
    workerId: "worker_node_01",
    provider: "Razorpay Sandbox",
    availableAt: "2026-08-22T14:08:37.000Z",
    claimedAt: "2026-08-22T14:08:38.000Z",
    leaseExpiresAt: "2026-08-22T14:09:38.000Z",
    createdAt: "2026-08-22T14:08:37.000Z",
    correlationId: "corr_demo_1g",
  },
];

const SANDBOX_WORKERS: WorkerItem[] = [
  {
    workerId: "worker_node_01",
    hostname: "engine-worker-pod-01",
    processId: 1042,
    status: "RUNNING",
    startedAt: "2026-08-25T08:00:00.000Z",
    lastHeartbeatAt: "2026-08-25T14:15:00.000Z",
    capabilities: ["RECOVERY_CYCLE", "IDEMPOTENCY_RETRY"],
    version: "1.0.0",
  },
  {
    workerId: "worker_node_02",
    hostname: "engine-worker-pod-02",
    processId: 1043,
    status: "RUNNING",
    startedAt: "2026-08-25T08:00:00.000Z",
    lastHeartbeatAt: "2026-08-25T14:15:00.000Z",
    capabilities: ["RECOVERY_CYCLE", "HIGH_PRIORITY"],
    version: "1.0.0",
  },
  {
    workerId: "worker_node_03",
    hostname: "engine-worker-pod-03",
    processId: 1044,
    status: "RUNNING",
    startedAt: "2026-08-25T08:00:00.000Z",
    lastHeartbeatAt: "2026-08-25T14:15:00.000Z",
    capabilities: ["RECOVERY_CYCLE", "ASYNC_POLL"],
    version: "1.0.0",
  },
  {
    workerId: "worker_node_04",
    hostname: "engine-worker-pod-04",
    processId: 1045,
    status: "IDLE",
    startedAt: "2026-08-25T08:00:00.000Z",
    lastHeartbeatAt: "2026-08-25T14:15:00.000Z",
    capabilities: ["RECOVERY_CYCLE", "DEAD_LETTER_REQUEUE"],
    version: "1.0.0",
  },
];

async function fetchBackendJson<T>(endpoint: string, includeAuth = true): Promise<T | null> {
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

export async function fetchJobsList(): Promise<JobsPageResponse> {
  const [queueRes, jobsRes, workersRes] = await Promise.all([
    fetchBackendJson<{
      status: string;
      queued: number;
      claimed: number;
      succeeded: number;
      failed: number;
      dead_letter: number;
      backpressure_level: string;
    }>("/api/v1/operations/queue/status", true),
    fetchBackendJson<{
      count: number;
      total: number;
      jobs: Array<{
        job_id: string;
        case_id: string;
        payment_id?: string;
        job_type?: string;
        status: string;
        priority?: string;
        attempt_number: number;
        max_attempts: number;
        available_at?: string;
        claimed_at?: string;
        lease_expires_at?: string;
        created_at?: string;
        last_error?: string;
        correlation_id?: string;
      }>;
    }>("/api/v1/operations/jobs?limit=200", true),
    fetchBackendJson<{
      total: number;
      workers: Array<{
        worker_id: string;
        hostname: string;
        process_id: number;
        status: string;
        started_at?: string;
        last_heartbeat_at?: string;
        capabilities: string[];
        version: string;
      }>;
    }>("/api/v1/operations/workers", true),
  ]);

  if (jobsRes && jobsRes.jobs && jobsRes.jobs.length > 0) {
    const mappedJobs: JobItem[] = jobsRes.jobs.map((j) => ({
      jobId: j.job_id,
      caseId: j.case_id,
      paymentId: j.payment_id || `pay_${j.case_id?.slice(-8) || "ref"}`,
      jobType: j.job_type || "RECOVERY_CYCLE",
      status: j.status || "QUEUED",
      priority: j.priority || "MEDIUM",
      attemptNumber: j.attempt_number || 1,
      maxAttempts: j.max_attempts || 3,
      workerId: j.status === "CLAIMED" ? "worker_node_01" : undefined,
      provider: "Razorpay Gateway",
      availableAt: j.available_at,
      claimedAt: j.claimed_at,
      leaseExpiresAt: j.lease_expires_at,
      createdAt: j.created_at || new Date().toISOString(),
      lastError: j.last_error,
      correlationId: j.correlation_id,
    }));

    const queueStatus: QueueStatus = {
      queued: queueRes?.queued ?? mappedJobs.filter((j) => j.status === "QUEUED").length,
      claimed: queueRes?.claimed ?? mappedJobs.filter((j) => j.status === "CLAIMED").length,
      succeeded: queueRes?.succeeded ?? mappedJobs.filter((j) => j.status === "SUCCEEDED").length,
      failed: queueRes?.failed ?? mappedJobs.filter((j) => j.status === "FAILED").length,
      deadLetter: queueRes?.dead_letter ?? mappedJobs.filter((j) => j.status === "DEAD_LETTER").length,
      backpressureLevel: queueRes?.backpressure_level || "NORMAL",
      status: queueRes?.status || "healthy",
    };

    const mappedWorkers: WorkerItem[] = (workersRes?.workers || []).map((w) => ({
      workerId: w.worker_id,
      hostname: w.hostname,
      processId: w.process_id,
      status: w.status,
      startedAt: w.started_at,
      lastHeartbeatAt: w.last_heartbeat_at,
      capabilities: w.capabilities || [],
      version: w.version,
    }));

    return {
      queueStatus,
      jobs: mappedJobs,
      workers: mappedWorkers.length > 0 ? mappedWorkers : SANDBOX_WORKERS,
      isLive: true,
    };
  }

  // Fallback to Sandbox Baseline
  return {
    queueStatus: {
      queued: 1,
      claimed: 1,
      succeeded: 6,
      failed: 1,
      deadLetter: 1,
      backpressureLevel: "NORMAL",
      status: "healthy",
    },
    jobs: SANDBOX_JOBS,
    workers: SANDBOX_WORKERS,
    isLive: false,
  };
}

export async function fetchJobDetail(jobId: string): Promise<JobDetailBundle | null> {
  const jobsData = await fetchJobsList();
  const job = jobsData.jobs.find(
    (j) => j.jobId.toLowerCase() === jobId.toLowerCase()
  );

  if (!job) {
    return null;
  }

  const worker = jobsData.workers.find((w) => w.workerId === job.workerId) || jobsData.workers[0];

  const timeline: JobTimelineRecord[] = [
    {
      id: `evt_job_created_${job.jobId}`,
      eventType: "JOB_ENQUEUED",
      timestamp: job.createdAt,
      title: "Job Registered in Queue",
      description: `Recovery job ${job.jobId} enqueued for case ${job.caseId} with priority ${job.priority}.`,
      status: "INFO",
    },
  ];

  if (job.claimedAt || job.status !== "QUEUED") {
    timeline.push({
      id: `evt_job_claimed_${job.jobId}`,
      eventType: "LEASE_ACQUIRED",
      timestamp: job.claimedAt || job.createdAt,
      title: `Worker Lease Acquired (${worker?.workerId || "worker_node_01"})`,
      description: `Atomic skip-locked claim acquired by ${worker?.hostname || "engine-worker-pod"}.`,
      status: "INFO",
    });
  }

  if (job.status === "SUCCEEDED") {
    timeline.push({
      id: `evt_job_success_${job.jobId}`,
      eventType: "EXECUTION_SUCCEEDED",
      timestamp: job.claimedAt || job.createdAt,
      title: "Recovery Execution Completed",
      description: "Idempotent payment capture confirmed by acquiring gateway.",
      status: "SUCCESS",
    });
  } else if (job.status === "FAILED") {
    timeline.push({
      id: `evt_job_failed_${job.jobId}`,
      eventType: "EXECUTION_FAILED",
      timestamp: job.claimedAt || job.createdAt,
      title: "Execution Interrupted",
      description: job.lastError || "Execution attempt failed threshold limits.",
      status: "FAILED",
    });
  } else if (job.status === "DEAD_LETTER") {
    timeline.push({
      id: `evt_job_dlq_${job.jobId}`,
      eventType: "DEAD_LETTER_ROUTED",
      timestamp: job.claimedAt || job.createdAt,
      title: "Routed to Dead-Letter Queue",
      description: "Exhausted maximum retry budget (3/3 attempts).",
      status: "FAILED",
    });
  }

  return {
    jobId: job.jobId,
    caseId: job.caseId,
    paymentId: job.paymentId,
    jobType: job.jobType,
    status: job.status,
    priority: job.priority,
    attemptNumber: job.attemptNumber,
    maxAttempts: job.maxAttempts,
    workerId: worker?.workerId || "worker_node_01",
    workerHostname: worker?.hostname || "engine-worker-pod-01",
    provider: job.provider || "Razorpay Gateway",
    availableAt: job.availableAt,
    claimedAt: job.claimedAt,
    leaseExpiresAt: job.leaseExpiresAt,
    createdAt: job.createdAt,
    lastError: job.lastError,
    correlationId: job.correlationId,
    timeline,
    isLive: jobsData.isLive,
  };
}
