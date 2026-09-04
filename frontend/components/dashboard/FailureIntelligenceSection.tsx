"use client";

import React from "react";
import { FailureIntelligenceItem } from "@/lib/types/dashboard";

export interface FailureIntelligenceSectionProps {
  failureItems?: FailureIntelligenceItem[];
}

const DEFAULT_FAILURES: FailureIntelligenceItem[] = [
  {
    rank: "01",
    code: "BANK_TIMEOUT",
    severity: "HIGH",
    severityColor: "var(--rf-warning)",
    count: 482,
    pct: "38.9%",
    barWidth: "38.9%",
    recoverability: "92% Yield",
  },
  {
    rank: "02",
    code: "NETWORK_FAILURE",
    severity: "MEDIUM",
    severityColor: "var(--rf-cyan)",
    count: 318,
    pct: "25.6%",
    barWidth: "25.6%",
    recoverability: "88% Yield",
  },
  {
    rank: "03",
    code: "INSUFFICIENT_FUNDS",
    severity: "LOW",
    severityColor: "var(--rf-text-muted)",
    count: 214,
    pct: "17.3%",
    barWidth: "17.3%",
    recoverability: "54% Yield",
  },
  {
    rank: "04",
    code: "CARD_DECLINED",
    severity: "HIGH",
    severityColor: "var(--rf-danger)",
    count: 132,
    pct: "10.6%",
    barWidth: "10.6%",
    recoverability: "41% Yield",
  },
  {
    rank: "05",
    code: "AUTHENTICATION_FAILURE",
    severity: "CRITICAL",
    severityColor: "var(--rf-danger)",
    count: 94,
    pct: "7.6%",
    barWidth: "7.6%",
    recoverability: "68% Yield",
  },
];

export const FailureIntelligenceSection: React.FC<FailureIntelligenceSectionProps> = ({
  failureItems = DEFAULT_FAILURES,
}) => {
  const list = failureItems && failureItems.length > 0 ? failureItems : DEFAULT_FAILURES;

  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      className="rf-intelligence-container"
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--rf-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Failure Intelligence
            </span>
            <span style={{ fontSize: "12px", color: "var(--rf-text-muted)" }}>
              • Propensity Ranking
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
            Root-cause taxonomy and deterministic recoverability yield
          </span>
        </div>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 650,
            padding: "2px 6px",
            backgroundColor: "var(--rf-surface-subtle)",
            color: "var(--rf-text-secondary)",
            borderRadius: "var(--rf-radius-badge)",
            border: "1px solid var(--rf-border)",
          }}
          className="font-mono"
        >
          {list.length} CATEGORIES
        </span>
      </div>

      {/* Analytical Ranked Surface */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {list.map((item, idx) => (
          <div
            key={item.rank + item.code}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "10px 14px",
              backgroundColor: "var(--rf-surface-subtle)",
              border: "1px solid var(--rf-border-subtle)",
              borderRadius: "var(--rf-radius-control)",
              transition: "background-color 100ms ease",
            }}
            className="rf-failure-row"
          >
            {/* Upper row: Rank + Code + Badges + Numbers */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "var(--rf-text-muted)",
                    width: "20px",
                  }}
                  className="font-mono"
                >
                  {item.rank}
                </span>

                <code
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "var(--rf-navy-primary)",
                    letterSpacing: "-0.01em",
                  }}
                  className="font-mono"
                >
                  {item.code}
                </code>

                <span
                  style={{
                    fontSize: "9.5px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    padding: "1px 5px",
                    borderRadius: "3px",
                    backgroundColor:
                      item.severity === "CRITICAL"
                        ? "var(--rf-danger-surface)"
                        : item.severity === "HIGH"
                        ? "var(--rf-warning-surface)"
                        : item.severity === "MEDIUM"
                        ? "var(--rf-cyan-surface)"
                        : "rgba(16, 42, 67, 0.05)",
                    color: item.severityColor,
                    border: `1px solid ${item.severityColor}40`,
                  }}
                >
                  {item.severity}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 650,
                    color: "var(--rf-emerald-text)",
                  }}
                  className="font-mono"
                >
                  {item.recoverability}
                </span>

                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--rf-navy-primary)",
                    }}
                    className="font-mono tabular-nums"
                  >
                    {item.count}
                  </span>
                  <span
                    style={{
                      fontSize: "11.5px",
                      color: "var(--rf-text-secondary)",
                      minWidth: "42px",
                      textAlign: "right",
                    }}
                    className="font-mono tabular-nums"
                  >
                    ({item.pct})
                  </span>
                </div>
              </div>
            </div>

            {/* Proportional hairline bar */}
            <div
              style={{
                width: "100%",
                height: "4px",
                backgroundColor: "var(--rf-canvas)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: item.barWidth,
                  height: "100%",
                  backgroundColor:
                    idx === 0
                      ? "var(--rf-emerald)"
                      : idx === 1
                      ? "var(--rf-cyan)"
                      : idx === 2
                      ? "var(--rf-blue-queued)"
                      : "var(--rf-danger)",
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .rf-failure-row:hover {
          background-color: #FFFFFF !important;
          border-color: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
};
