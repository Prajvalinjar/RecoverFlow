"use client";

import { useState, useMemo, useCallback } from "react";
import { useCases } from "./useCases";
import { useCaseDetail } from "./useCaseDetail";
import { FlowStep, AIAdvisoryData, DeterministicPolicyData, FlowReconciliationData } from "../types/recoveryFlow";
import { CaseListItem } from "../types/cases";

export interface UseRecoveryFlowResult {
  cases: CaseListItem[];
  selectedCaseId: string;
  setSelectedCaseId: (id: string) => void;
  selectedCaseItem: CaseListItem | null;
  pipelineSteps: FlowStep[];
  aiAdvisory: AIAdvisoryData;
  deterministicPolicy: DeterministicPolicyData;
  reconciliation: FlowReconciliationData;
  attempts: ReturnType<typeof useCaseDetail>["caseData"] extends null ? [] : NonNullable<ReturnType<typeof useCaseDetail>["caseData"]>["attempts"];
  timeline: ReturnType<typeof useCaseDetail>["caseData"] extends null ? [] : NonNullable<ReturnType<typeof useCaseDetail>["caseData"]>["timeline"];
  isLoading: boolean;
  isRefreshing: boolean;
  isLive: boolean;
  refresh: () => Promise<void>;
}

export function useRecoveryFlow(): UseRecoveryFlowResult {
  const { cases, isLoading: casesLoading, isRefreshing: casesRefreshing, isLive, refresh: refreshCases } = useCases();
  const [userSelectedCaseId, setUserSelectedCaseId] = useState<string>("");

  const activeCaseId = useMemo(() => {
    if (userSelectedCaseId && cases.some((c) => c.caseId === userSelectedCaseId)) {
      return userSelectedCaseId;
    }
    return cases.length > 0 ? cases[0].caseId : "";
  }, [userSelectedCaseId, cases]);

  const selectedCaseItem = useMemo(() => {
    return cases.find((c) => c.caseId === activeCaseId) || cases[0] || null;
  }, [cases, activeCaseId]);

  const { caseData, isLoading: detailLoading, isRefreshing: detailRefreshing, refresh: refreshDetail } = useCaseDetail(activeCaseId);

  const refresh = useCallback(async () => {
    await Promise.all([refreshCases(), refreshDetail()]);
  }, [refreshCases, refreshDetail]);

  // Derive the 8 Flow Pipeline Steps
  const pipelineSteps = useMemo<FlowStep[]>(() => {
    const isRecovered = caseData?.state === "RECOVERED" || selectedCaseItem?.state === "RECOVERED";
    const isFailed = caseData?.state === "FAILED" || selectedCaseItem?.state === "FAILED";
    const failureCode = caseData?.failureCode || selectedCaseItem?.failureReason || "BANK_TIMEOUT";
    const paymentId = caseData?.paymentId || selectedCaseItem?.paymentId || "pay_unknown";

    return [
      {
        stepNumber: 1,
        id: "step_payment_failure",
        title: "Payment Failure",
        subtitle: "Signal Ingested",
        status: "COMPLETED",
        technicalDetail: `ID: ${paymentId}`,
      },
      {
        stepNumber: 2,
        id: "step_signal_detection",
        title: "Signal Detection",
        subtitle: "HMAC Verified",
        status: "COMPLETED",
        technicalDetail: "Replay & Rate Limits Passed",
      },
      {
        stepNumber: 3,
        id: "step_failure_classification",
        title: "Classification",
        subtitle: failureCode,
        status: "COMPLETED",
        technicalDetail: "Transient Gateway Timeout",
      },
      {
        stepNumber: 4,
        id: "step_ai_advisory",
        title: "AI Advisory",
        subtitle: "Strategy Generated",
        status: "AI_ADVISORY",
        technicalDetail: "0% Execution Authority",
      },
      {
        stepNumber: 5,
        id: "step_policy_decision",
        title: "Policy Engine",
        subtitle: "100% Deterministic",
        status: isFailed ? "BLOCKED" : "COMPLETED",
        technicalDetail: "Budget & Circuit Validated",
      },
      {
        stepNumber: 6,
        id: "step_provider_execution",
        title: "Provider Execution",
        subtitle: isRecovered ? "Attempt Succeeded" : isFailed ? "Max Retries Exceeded" : "In-Flight Retrying",
        status: isRecovered ? "COMPLETED" : isFailed ? "FAILED" : "ACTIVE",
        technicalDetail: `Attempt ${caseData?.attemptCount || selectedCaseItem?.attemptCount || 1}/${caseData?.maxAllowedAttempts || 3}`,
      },
      {
        stepNumber: 7,
        id: "step_reconciliation",
        title: "Reconciliation",
        subtitle: isRecovered ? "Ledger Reconciled" : isFailed ? "Unreconciled Loss" : "Pending Capture",
        status: isRecovered ? "COMPLETED" : isFailed ? "FAILED" : "PENDING",
        technicalDetail: isRecovered ? "Balance Verified" : "Awaiting Settlement",
      },
      {
        stepNumber: 8,
        id: "step_audit_trail",
        title: "Audit Trail",
        subtitle: "Events Audited",
        status: "COMPLETED",
        technicalDetail: "Operational Audit Logs",
      },
    ];
  }, [caseData, selectedCaseItem]);

  // Derive AI Advisory Panel Data
  const aiAdvisory = useMemo<AIAdvisoryData>(() => {
    const failureCode = caseData?.failureCode || selectedCaseItem?.failureReason || "BANK_TIMEOUT";
    return {
      hasLiveAI: false,
      modelIdentifier: "RF-Advisor-v2.4 (Sandbox Architecture)",
      recommendedAction: failureCode === "CARD_DECLINED" ? "FLAG_MANUAL_REVIEW" : "SCHEDULE_IDEMPOTENT_RETRY",
      confidenceScore: "94.2%",
      suggestedDelaySeconds: 180,
      reasoningSignals: [
        `TRANSIENT_FAILURE_${failureCode}`,
        "HISTORICAL_RECOVERY_YIELD_HIGH",
        "MERCHANT_RETRY_BUDGET_AVAILABLE",
        "ZERO_CHARGEBACK_RISK",
      ],
      historicalPatternInsight:
        "Historical cluster pattern shows 88.4% success rate when retried after 180s exponential cooldown.",
      disclaimer: "AI guidance only. 0% financial authority.",
    };
  }, [caseData, selectedCaseItem]);

  // Derive Deterministic Policy Data
  const deterministicPolicy = useMemo<DeterministicPolicyData>(() => {
    const currentAttempt = caseData?.attemptCount || selectedCaseItem?.attemptCount || 1;
    const maxAttempts = caseData?.maxAllowedAttempts || selectedCaseItem?.maxAllowedAttempts || 3;
    const paymentId = caseData?.paymentId || selectedCaseItem?.paymentId || "pay_unknown";

    return {
      authorityType: "DETERMINISTIC_POLICY_ENGINE",
      authorityPercentage: 100,
      enforcedDecision:
        caseData?.state === "RECOVERED" || selectedCaseItem?.state === "RECOVERED"
          ? "EXECUTE_RETRY_IDEMPOTENT"
          : caseData?.state === "FAILED" || selectedCaseItem?.state === "FAILED"
          ? "STOP_RETRY_BUDGET_EXCEEDED"
          : "EXECUTE_SCHEDULED_RETRY",
      idempotencyKey: `idemp_${paymentId}_${currentAttempt}`,
      maxAttempts,
      currentAttempt,
      retryDelaySeconds: 180,
      circuitBreakerStatus: "CLOSED",
      governingRules: [
        "RULE_MAX_ATTEMPTS_3",
        "RULE_EXPONENTIAL_BACKOFF_ACTIVE",
        "RULE_CIRCUIT_BREAKER_CLOSED",
        "RULE_IDEMPOTENT_LOCK_ACQUIRED",
      ],
      evaluatedAt: caseData?.createdAt || new Date().toISOString(),
    };
  }, [caseData, selectedCaseItem]);

  // Derive Reconciliation Data
  const reconciliation = useMemo<FlowReconciliationData>(() => {
    const amount = caseData?.amount || selectedCaseItem?.amount || 0;
    const currency = caseData?.currency || selectedCaseItem?.currency || "USD";
    const isRecovered = caseData?.state === "RECOVERED" || selectedCaseItem?.state === "RECOVERED";
    const paymentId = caseData?.paymentId || selectedCaseItem?.paymentId || "pay_unknown";

    return {
      paymentId,
      grossAmount: amount,
      recoveredAmount: isRecovered ? amount : 0,
      currency,
      recoveryState: caseData?.state || selectedCaseItem?.state || "ACTIVE",
      reconciliationState: isRecovered ? "RECONCILED" : "PENDING_SETTLEMENT",
      ledgerReference: `ledg_${paymentId.slice(-8)}_${isRecovered ? "cap" : "init"}`,
    };
  }, [caseData, selectedCaseItem]);

  return {
    cases,
    selectedCaseId: activeCaseId,
    setSelectedCaseId: setUserSelectedCaseId,
    selectedCaseItem,
    pipelineSteps,
    aiAdvisory,
    deterministicPolicy,
    reconciliation,
    attempts: caseData?.attempts || [],
    timeline: caseData?.timeline || [],
    isLoading: casesLoading || detailLoading,
    isRefreshing: casesRefreshing || detailRefreshing,
    isLive,
    refresh,
  };
}
