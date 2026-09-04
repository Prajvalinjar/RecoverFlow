/**
 * RecoverFlow Recovery Orchestration & Pipeline Types
 */

export interface FlowStep {
  stepNumber: number;
  id: string;
  title: string;
  subtitle: string;
  status: "COMPLETED" | "ACTIVE" | "PENDING" | "FAILED" | "BLOCKED" | "AI_ADVISORY";
  technicalDetail?: string;
  timestamp?: string;
}

export interface AIAdvisoryData {
  hasLiveAI: boolean;
  modelIdentifier: string;
  recommendedAction: string;
  confidenceScore?: string;
  suggestedDelaySeconds?: number;
  reasoningSignals: string[];
  historicalPatternInsight: string;
  disclaimer: string;
}

export interface DeterministicPolicyData {
  authorityType: string;
  authorityPercentage: number;
  enforcedDecision: string;
  idempotencyKey: string;
  maxAttempts: number;
  currentAttempt: number;
  retryDelaySeconds: number;
  circuitBreakerStatus: "CLOSED" | "HALF_OPEN" | "OPEN";
  governingRules: string[];
  evaluatedAt: string;
}

export interface FlowReconciliationData {
  paymentId: string;
  grossAmount: number;
  recoveredAmount: number;
  currency: string;
  recoveryState: string;
  reconciliationState: "RECONCILED" | "PENDING_SETTLEMENT" | "UNRECONCILED" | "FAILED";
  ledgerReference: string;
}
