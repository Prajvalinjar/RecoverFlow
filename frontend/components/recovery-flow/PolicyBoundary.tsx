"use client";

import React from "react";
import { AIAdvisoryData, DeterministicPolicyData } from "@/lib/types/recoveryFlow";
import { Sparkles, ShieldCheck, ArrowRight, Lock, Bot } from "lucide-react";

interface PolicyBoundaryProps {
  aiData: AIAdvisoryData;
  policyData: DeterministicPolicyData;
  isLoading?: boolean;
}

export const PolicyBoundary: React.FC<PolicyBoundaryProps> = ({
  aiData,
  policyData,
  isLoading = false,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap: "16px",
        alignItems: "stretch",
        opacity: isLoading ? 0.7 : 1,
        transition: "opacity 150ms ease",
      }}
      className="rf-policy-boundary-container"
    >
      {/* 1. Left Panel: AI Intelligence Advisory (Violet) */}
      <div
        style={{
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-ai-border)",
          borderRadius: "var(--rf-radius-surface)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 18px",
            backgroundColor: "var(--rf-ai-surface)",
            borderBottom: "1px solid var(--rf-ai-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={15} color="var(--rf-ai-violet)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              AI Intelligence Advisory
            </span>
          </div>

          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "3px",
              backgroundColor: "var(--rf-surface)",
              color: "var(--rf-ai-violet)",
              border: "1px solid var(--rf-ai-border)",
            }}
            className="font-mono"
          >
            0% EXECUTION AUTHORITY
          </span>
        </div>

        {/* Content Body */}
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {/* Explanation text */}
          <div
            style={{
              fontSize: "12px",
              color: "var(--rf-text-secondary)",
              lineHeight: 1.45,
              padding: "8px 12px",
              backgroundColor: "var(--rf-surface-subtle)",
              borderRadius: "var(--rf-radius-control)",
              border: "1px solid var(--rf-border-subtle)",
            }}
          >
            <Bot size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "6px", color: "var(--rf-ai-violet)" }} />
            AI evaluates contextual recovery signals and suggests routing strategies. It holds <strong>0% financial authority</strong> and cannot execute transactions.
          </div>

          {/* Model info & Recommendation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Advisory Model:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {aiData.modelIdentifier}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Recommended Action:</span>
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--rf-ai-violet)",
                  padding: "1px 6px",
                  backgroundColor: "var(--rf-ai-surface)",
                  borderRadius: "3px",
                }}
                className="font-mono"
              >
                {aiData.recommendedAction}
              </span>
            </div>

            {aiData.suggestedDelaySeconds !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--rf-text-muted)" }}>Suggested Delay:</span>
                <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                  {aiData.suggestedDelaySeconds}s backoff
                </span>
              </div>
            )}
          </div>

          {/* Reasoning signals */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase" }}>
              Contextual Signals Evaluated
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {aiData.reasoningSignals.map((sig) => (
                <span
                  key={sig}
                  style={{
                    fontSize: "10.5px",
                    padding: "2px 6px",
                    backgroundColor: "var(--rf-surface-subtle)",
                    border: "1px solid var(--rf-border)",
                    borderRadius: "3px",
                    color: "var(--rf-text-secondary)",
                  }}
                  className="font-mono"
                >
                  {sig}
                </span>
              ))}
            </div>
          </div>

          {/* Insight pattern */}
          <div
            style={{
              marginTop: "auto",
              fontSize: "11px",
              color: "var(--rf-text-muted)",
              fontStyle: "italic",
              borderTop: "1px solid var(--rf-border-subtle)",
              paddingTop: "8px",
            }}
          >
            {aiData.historicalPatternInsight}
          </div>
        </div>
      </div>

      {/* 2. Middle Connector / Enforcement Gateway */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "10px 0",
        }}
        className="rf-policy-connector"
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Lock size={15} color="var(--rf-navy-primary)" />
        </div>
        <span
          style={{
            fontSize: "9.5px",
            fontWeight: 700,
            color: "var(--rf-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            textAlign: "center",
            writingMode: "vertical-rl",
          }}
          className="font-mono rf-policy-gate-label"
        >
          POLICY GATE
        </span>
        <ArrowRight size={14} color="var(--rf-emerald)" className="rf-policy-arrow" />
      </div>

      {/* 3. Right Panel: Deterministic Policy Engine (Emerald) */}
      <div
        style={{
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-emerald-border)",
          borderRadius: "var(--rf-radius-surface)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 18px",
            backgroundColor: "var(--rf-emerald-surface)",
            borderBottom: "1px solid var(--rf-emerald-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={15} color="var(--rf-emerald)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Deterministic Policy Engine
            </span>
          </div>

          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "3px",
              backgroundColor: "var(--rf-emerald-text)",
              color: "#FFFFFF",
            }}
            className="font-mono"
          >
            100% EXECUTION AUTHORITY
          </span>
        </div>

        {/* Content Body */}
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {/* Explanation text */}
          <div
            style={{
              fontSize: "12px",
              color: "var(--rf-text-secondary)",
              lineHeight: 1.45,
              padding: "8px 12px",
              backgroundColor: "var(--rf-surface-subtle)",
              borderRadius: "var(--rf-radius-control)",
              border: "1px solid var(--rf-border-subtle)",
            }}
          >
            Mathematical rule enforcement. Governs retry budgets, concurrency limits, circuit health, and idempotency guarantees.
          </div>

          {/* Hard Constraints Matrix */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              backgroundColor: "var(--rf-surface-subtle)",
              padding: "10px",
              borderRadius: "var(--rf-radius-control)",
              border: "1px solid var(--rf-border)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", color: "var(--rf-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                MAX ATTEMPTS
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono">
                {policyData.maxAttempts}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", color: "var(--rf-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                CURRENT ATTEMPT
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-emerald-text)" }} className="font-mono">
                {policyData.currentAttempt} / {policyData.maxAttempts}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", color: "var(--rf-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                RETRY DELAY
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono">
                {policyData.retryDelaySeconds}s
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", color: "var(--rf-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                CIRCUIT STATUS
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-emerald-text)" }} className="font-mono">
                {policyData.circuitBreakerStatus}
              </span>
            </div>
          </div>

          {/* Idempotency key */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--rf-text-muted)" }}>Idempotency Key:</span>
            <code style={{ fontSize: "11px", color: "var(--rf-navy-primary)", fontWeight: 600 }} className="font-mono">
              {policyData.idempotencyKey}
            </code>
          </div>

          {/* Enforced verdict */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <span style={{ color: "var(--rf-text-muted)" }}>Enforced Verdict:</span>
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 750,
                color: "var(--rf-emerald-text)",
                padding: "2px 8px",
                backgroundColor: "var(--rf-emerald-surface)",
                border: "1px solid var(--rf-emerald-border)",
                borderRadius: "4px",
              }}
              className="font-mono"
            >
              {policyData.enforcedDecision}
            </span>
          </div>

          {/* Governing rules */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "auto" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase" }}>
              Governing Policy Rules
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {policyData.governingRules.map((rule) => (
                <span
                  key={rule}
                  style={{
                    fontSize: "10.5px",
                    padding: "2px 6px",
                    backgroundColor: "var(--rf-emerald-surface)",
                    border: "1px solid var(--rf-emerald-border)",
                    borderRadius: "3px",
                    color: "var(--rf-emerald-text)",
                  }}
                  className="font-mono"
                >
                  {rule}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .rf-policy-boundary-container {
            grid-template-columns: 1fr !important;
          }
          .rf-policy-connector {
            flex-direction: row !important;
            padding: 8px 0 !important;
          }
          .rf-policy-gate-label {
            writing-mode: horizontal-tb !important;
          }
        }
      `}</style>
    </div>
  );
};
