"use client";

import React from "react";
import { AnalyticsFailureItem } from "@/lib/types/analytics";

export interface FailureAnalysisProps {
  items: AnalyticsFailureItem[];
}

export const FailureAnalysis: React.FC<FailureAnalysisProps> = ({ items }) => {
  const maxCount = items[0]?.count || 1;

  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Failure Analysis
            </h2>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: "var(--rf-warning-text)",
                backgroundColor: "var(--rf-warning-surface)",
                border: "1px solid var(--rf-warning-border)",
                padding: "2px 6px",
                borderRadius: "var(--rf-radius-badge)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              SANDBOX BASELINE
            </span>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--rf-text-secondary)", marginTop: "2px" }}>
            Taxonomy distribution and empirical autonomous recovery yield across 1,240 cases.
          </p>
        </div>
      </div>

      {/* Horizontal Ranked Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.map((item) => {
          const barWidth = Math.round((item.count / maxCount) * 100);

          return (
            <div
              key={item.code}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                padding: "10px 12px",
                borderRadius: "var(--rf-radius-control)",
                backgroundColor: "var(--rf-surface-subtle)",
                border: "1px solid var(--rf-border-subtle)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--rf-text-muted)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    #{item.rank}
                  </span>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: "var(--rf-navy-primary)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    {item.code}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
                    • {item.displayName}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "10px",
                      fontWeight: 700,
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      border: `1px solid ${item.severityColor}`,
                      color: item.severityColor,
                    }}
                  >
                    {item.severity}
                  </span>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--rf-emerald-text)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      backgroundColor: "var(--rf-emerald-surface)",
                      border: "1px solid var(--rf-emerald-border)",
                      padding: "1px 6px",
                      borderRadius: "3px",
                    }}
                  >
                    {item.yieldRate}
                  </span>

                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 750,
                      color: "var(--rf-navy-primary)",
                      minWidth: "70px",
                      textAlign: "right",
                    }}
                    className="font-mono tabular-nums"
                  >
                    {item.count} <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }}>({item.pct})</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: "5px",
                  backgroundColor: "var(--rf-border-subtle)",
                  borderRadius: "2.5px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    backgroundColor: item.severityColor,
                    borderRadius: "2.5px",
                    transition: "width 300ms ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
