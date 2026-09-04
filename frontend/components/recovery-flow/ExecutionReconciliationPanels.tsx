"use client";

import React from "react";
import { FlowReconciliationData } from "@/lib/types/recoveryFlow";
import { CaseAttemptRecord, CaseTimelineEvent } from "@/lib/types/cases";
import { formatMoney } from "@/lib/utils/money";
import { Cpu, DollarSign, History, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ExecutionReconciliationPanelsProps {
  attempts: CaseAttemptRecord[];
  reconciliation: FlowReconciliationData;
  timeline: CaseTimelineEvent[];
  isLoading?: boolean;
}

export const ExecutionReconciliationPanels: React.FC<ExecutionReconciliationPanelsProps> = ({
  attempts,
  reconciliation,
  timeline,
  isLoading = false,
}) => {
  function formatDate(iso?: string) {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        opacity: isLoading ? 0.7 : 1,
        transition: "opacity 150ms ease",
      }}
    >
      {/* Top Grid: Execution History & Reconciliation Panel (50/50 Grid) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="rf-exec-grid">
        {/* Panel 1: Execution Engine & Attempts */}
        <div
          style={{
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 18px",
              backgroundColor: "var(--rf-surface-subtle)",
              borderBottom: "1px solid var(--rf-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Cpu size={15} color="var(--rf-cyan)" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
                Provider Execution Attempts
              </span>
            </div>

            <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }} className="font-mono">
              {attempts.length} ATTEMPTS
            </span>
          </div>

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {attempts.map((att) => (
              <div
                key={att.attemptNumber}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  backgroundColor: "var(--rf-surface-subtle)",
                  border: "1px solid var(--rf-border)",
                  borderRadius: "var(--rf-radius-control)",
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {att.status === "SUCCESS" ? (
                    <CheckCircle2 size={14} color="var(--rf-emerald)" />
                  ) : (
                    <XCircle size={14} color="var(--rf-danger)" />
                  )}
                  <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono">
                    ATTEMPT 0{att.attemptNumber}
                  </span>
                  <span style={{ color: "var(--rf-text-muted)" }}>• {att.provider}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {att.latencyMs && (
                    <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }} className="font-mono">
                      {att.latencyMs}ms
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: att.status === "SUCCESS" ? "var(--rf-emerald-text)" : "var(--rf-danger)",
                    }}
                    className="font-mono"
                  >
                    {att.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Ledger & Financial Reconciliation */}
        <div
          style={{
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 18px",
              backgroundColor: "var(--rf-surface-subtle)",
              borderBottom: "1px solid var(--rf-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <DollarSign size={15} color="var(--rf-emerald)" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
                Ledger Financial Reconciliation
              </span>
            </div>

            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "3px",
                backgroundColor:
                  reconciliation.reconciliationState === "RECONCILED"
                    ? "var(--rf-emerald-surface)"
                    : "var(--rf-canvas)",
                color:
                  reconciliation.reconciliationState === "RECONCILED"
                    ? "var(--rf-emerald-text)"
                    : "var(--rf-text-muted)",
                border: `1px solid ${
                  reconciliation.reconciliationState === "RECONCILED"
                    ? "var(--rf-emerald-border)"
                    : "var(--rf-border)"
                }`,
              }}
              className="font-mono"
            >
              {reconciliation.reconciliationState}
            </span>
          </div>

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Gross Failed Amount:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono tabular-nums">
                {formatMoney(reconciliation.grossAmount, reconciliation.currency)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Recovered Amount:</span>
              <span
                style={{
                  fontWeight: 800,
                  color: reconciliation.recoveredAmount > 0 ? "var(--rf-emerald-text)" : "var(--rf-text-muted)",
                }}
                className="font-mono tabular-nums"
              >
                {formatMoney(reconciliation.recoveredAmount, reconciliation.currency)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Ledger Hash Ref:</span>
              <code style={{ fontSize: "11px", color: "var(--rf-navy-primary)" }} className="font-mono">
                {reconciliation.ledgerReference}
              </code>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Payment Reference:</span>
              <span style={{ color: "var(--rf-text-secondary)" }} className="font-mono">
                {reconciliation.paymentId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Chronological Audit Trail */}
      <div
        style={{
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            backgroundColor: "var(--rf-surface-subtle)",
            borderBottom: "1px solid var(--rf-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Chronological Audit Trail & Event Stream
            </span>
          </div>

          <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }} className="font-mono">
            {timeline.length} AUDITED EVENTS
          </span>
        </div>

        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {timeline.map((evt, idx) => (
            <div
              key={evt.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: "var(--rf-surface-subtle)",
                border: "1px solid var(--rf-border-subtle)",
                borderRadius: "var(--rf-radius-control)",
                fontSize: "12px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--rf-text-muted)", width: "20px" }} className="font-mono">
                  0{idx + 1}
                </span>
                {evt.status === "SUCCESS" ? (
                  <CheckCircle2 size={13} color="var(--rf-emerald)" />
                ) : evt.status === "FAILED" ? (
                  <XCircle size={13} color="var(--rf-danger)" />
                ) : (
                  <Clock size={13} color="var(--rf-cyan)" />
                )}
                <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }}>{evt.title}</span>
              </div>

              <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)", flex: 1, minWidth: "180px" }}>
                {evt.description}
              </span>

              <span style={{ fontSize: "11px", color: "var(--rf-text-muted)", whiteSpace: "nowrap" }} className="font-mono">
                {formatDate(evt.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .rf-exec-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
