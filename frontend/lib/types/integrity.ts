/**
 * RecoverFlow Financial Integrity Types: Reconciliation & Audit Trail
 */

// --- 1. RECONCILIATION ---

export type ReconciliationStatus = "MATCHED" | "UNMATCHED" | "PENDING" | "EXCEPTION";

export interface ReconciliationItem {
  reconciliationId: string;
  paymentId: string;
  caseId: string;
  jobId?: string;
  provider: string;
  expectedAmount: number;
  actualAmount: number;
  currency: string;
  status: ReconciliationStatus;
  discrepancy: number;
  reconciledAt: string;
  ledgerEntryId: string;
  notes?: string;
}

export interface ReconciliationSummary {
  totalRecords: number;
  matchedCount: number;
  unmatchedCount: number;
  pendingCount: number;
  exceptionCount: number;
  reconciledVolumeByCurrency: Record<string, number>;
}

export interface ReconciliationPageResponse {
  summary: ReconciliationSummary;
  records: ReconciliationItem[];
  isLive: boolean;
}

// --- 2. AUDIT TRAIL ---

export type AuditEventStatus = "SUCCESS" | "FAILED" | "INFO";

export interface AuditEventItem {
  eventId: string;
  eventType: string;
  entityType: "PAYMENT" | "CASE" | "JOB" | "POLICY" | "PROVIDER" | "QUEUE" | "SYSTEM" | string;
  entityId: string;
  actor: string;
  status: AuditEventStatus;
  timestamp: string;
  correlationId?: string;
  caseId?: string;
  paymentId?: string;
  jobId?: string;
  payload: Record<string, unknown>;
}

export interface AuditSummary {
  totalEvents: number;
  recoveryEvents: number;
  policyEvents: number;
  executionEvents: number;
  errorEvents: number;
}

export interface AuditPageResponse {
  summary: AuditSummary;
  events: AuditEventItem[];
  isLive: boolean;
}
