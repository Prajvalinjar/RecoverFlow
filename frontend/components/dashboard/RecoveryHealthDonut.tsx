"use client";

import React from "react";
import { RecoveryHealthData } from "@/lib/types/dashboard";

export interface RecoveryHealthDonutProps {
  healthData?: RecoveryHealthData;
}

const DEFAULT_HEALTH: RecoveryHealthData = {
  items: [
    { label: "Recovered", count: "921", pct: "74.26%", color: "var(--rf-emerald)" },
    { label: "Active", count: "142", pct: "11.45%", color: "var(--rf-cyan)" },
    { label: "Failed", count: "105", pct: "8.47%", color: "var(--rf-danger)" },
    { label: "Manual Review", count: "72", pct: "5.81%", color: "var(--rf-warning)" },
  ],
  recoveryRate: "74.26%",
  totalCasesLabel: "1,240 CASES",
  percentages: {
    recovered: 74.26,
    active: 11.45,
    failed: 8.47,
    manualReview: 5.81,
  },
};

export const RecoveryHealthDonut: React.FC<RecoveryHealthDonutProps> = ({
  healthData = DEFAULT_HEALTH,
}) => {
  const data = healthData || DEFAULT_HEALTH;
  const items = data.items;

  // SVG Ring calculation
  // Radius = 65, Circumference = 2 * PI * 65 = 408.4
  const circumference = 408.4;
  const strokeWidth = 14;

  const recPct = data.percentages.recovered;
  const actPct = data.percentages.active;
  const failPct = data.percentages.failed;
  const revPct = data.percentages.manualReview;

  const recoveredDash = (recPct / 100) * circumference;
  const activeDash = (actPct / 100) * circumference;
  const failedDash = (failPct / 100) * circumference;
  const reviewDash = (revPct / 100) * circumference;

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
      className="rf-health-container"
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--rf-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--rf-navy-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Recovery Health
          </span>
          <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
            Lifecycle distribution
          </span>
        </div>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 650,
            padding: "2px 6px",
            backgroundColor: "var(--rf-surface-light-blue)",
            color: "var(--rf-cyan-text)",
            borderRadius: "var(--rf-radius-badge)",
            border: "1px solid var(--rf-cyan-border)",
          }}
          className="font-mono"
        >
          {data.totalCasesLabel}
        </span>
      </div>

      {/* Donut Visualization */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ position: "relative", width: "160px", height: "160px" }}>
          <svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="65"
              fill="transparent"
              stroke="var(--rf-canvas)"
              strokeWidth={strokeWidth}
            />

            {/* Recovered Arc (Emerald) */}
            {recPct > 0 && (
              <circle
                cx="80"
                cy="80"
                r="65"
                fill="transparent"
                stroke="var(--rf-emerald)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${recoveredDash} ${circumference - recoveredDash}`}
                strokeDashoffset="0"
              />
            )}

            {/* Active Arc (Cyan) */}
            {actPct > 0 && (
              <circle
                cx="80"
                cy="80"
                r="65"
                fill="transparent"
                stroke="var(--rf-cyan)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${activeDash} ${circumference - activeDash}`}
                strokeDashoffset={`-${recoveredDash}`}
              />
            )}

            {/* Failed Arc (Danger) */}
            {failPct > 0 && (
              <circle
                cx="80"
                cy="80"
                r="65"
                fill="transparent"
                stroke="var(--rf-danger)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${failedDash} ${circumference - failedDash}`}
                strokeDashoffset={`-${recoveredDash + activeDash}`}
              />
            )}

            {/* Manual Review Arc (Warning) */}
            {revPct > 0 && (
              <circle
                cx="80"
                cy="80"
                r="65"
                fill="transparent"
                stroke="var(--rf-warning)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${reviewDash} ${circumference - reviewDash}`}
                strokeDashoffset={`-${recoveredDash + activeDash + failedDash}`}
              />
            )}
          </svg>

          {/* Center Metric */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
              className="tabular-nums font-mono"
            >
              {data.recoveryRate}
            </span>
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "var(--rf-text-muted)",
                textTransform: "uppercase",
                marginTop: "4px",
              }}
            >
              RECOVERY RATE
            </span>
          </div>
        </div>

        {/* Breakdown List Below */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12.5px",
                padding: "4px 0",
                borderBottom: idx === items.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "2px",
                    backgroundColor: row.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "var(--rf-navy-primary)", fontWeight: 550 }}>
                  {row.label}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "var(--rf-text-secondary)" }} className="font-mono tabular-nums">
                  {row.count}
                </span>
                <span
                  style={{
                    fontWeight: 650,
                    color: "var(--rf-navy-primary)",
                    minWidth: "48px",
                    textAlign: "right",
                  }}
                  className="font-mono tabular-nums"
                >
                  {row.pct}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
