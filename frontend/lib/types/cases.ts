/**
 * RecoverFlow Cases Domain & Investigation Contract Types
 */

export interface CaseListItem {
  caseId: string;
  paymentId: string;
  customerId: string;
  customerName?: string;
  amount: number;
  currency: string;
  failureReason: string;
  state: "RECOVERED" | "ACTIVE" | "MANUAL_REVIEW" | "QUEUED" | "FAILED" | string;
  attemptCount: number;
  maxAllowedAttempts: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  createdAt: string;
  updatedAt?: string;
}

export interface CasesListSummary {
  totalCases: number;
  activeCases: number;
  recoveredCases: number;
  failedCases: number;
  manualReviewCases: number;
}

export interface CasesListResponse {
  summary: CasesListSummary;
  cases: CaseListItem[];
  isLive: boolean;
}

export interface CaseTimelineEvent {
  id: string;
  eventType: string;
  timestamp: string;
  title: string;
  description: string;
  status?: "SUCCESS" | "FAILED" | "PENDING" | "INFO";
  details?: Record<string, unknown>;
}

export interface CaseAttemptRecord {
  attemptNumber: number;
  failureCode: string;
  status: "SUCCESS" | "FAILED" | "IN_FLIGHT";
  timestamp: string;
  provider: string;
  latencyMs?: number;
}

export interface CaseJobRecord {
  jobId: string;
  status: string;
  attemptNumber: number;
  maxAttempts: number;
  createdAt?: string;
  lastError?: string;
}

export interface CaseDetailBundle {
  caseId: string;
  paymentId: string;
  customerId: string;
  customerSegment?: string;
  customerTotalSpent?: string;
  state: "RECOVERED" | "ACTIVE" | "MANUAL_REVIEW" | "QUEUED" | "FAILED" | string;
  priority: string;
  amount: number;
  currency: string;
  failureCode: string;
  provider: string;
  attemptCount: number;
  maxAllowedAttempts: number;
  createdAt: string;
  updatedAt?: string;
  terminalReason?: string | null;
  policyDecision: {
    authorityType: "POLICY_DECISION" | "AI_ADVISORY";
    authorityPercentage: number;
    decision: string;
    idempotencyKey: string;
    evaluatedAt: string;
    rulesTriggered: string[];
  };
  attempts: CaseAttemptRecord[];
  jobs: CaseJobRecord[];
  timeline: CaseTimelineEvent[];
  isLive: boolean;
}
