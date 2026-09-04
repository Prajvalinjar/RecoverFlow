"use client";

import React from "react";
import { AnalyticsOutcomeSlice } from "@/lib/types/analytics";

export interface OutcomeDistributionProps {
  totalCases: number;
  totalCasesLabel: string;
  slices: AnalyticsOutcomeSlice[];
}

export const OutcomeDistribution: React.FC<OutcomeDistributionProps> = ({
  totalCasesLabel,
  slices,
}) => {
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
              Recovery Outcome Distribution
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
            Exhaustive lifecycle reconciliation across {totalCasesLabel}. All slices sum to 100%.
          </p>
        </div>

        <div
          style={{
            padding: "4px 10px",
            backgroundColor: "var(--rf-canvas)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-control)",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--rf-navy-primary)",
          }}
          className="font-mono tabular-nums"
        >
          {totalCasesLabel} RECONCILED
        </div>
      </div>

      {/* Segmented Bar */}
      <div
        style={{
          width: "100%",
          height: "12px",
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          backgroundColor: "var(--rf-border-subtle)",
        }}
        role="progressbar"
        aria-label="Outcome distribution breakdown"
      >
        {slices.map((slice) => (
          <div
            key={slice.label}
            style={{
              width: slice.pct,
              height: "100%",
              backgroundColor: slice.color,
              transition: "width 300ms ease",
            }}
            title={`${slice.label}: ${slice.count} (${slice.pct})`}
          />
        ))}
      </div>

      {/* Breakdown Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
        }}
      >
        {slices.map((slice) => (
          <div
            key={slice.label}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--rf-radius-control)",
              backgroundColor: "var(--rf-surface-subtle)",
              border: "1px solid var(--rf-border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "2px",
                    backgroundColor: slice.color,
                  }}
                />
                <span style={{ fontSize: "12.5px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>
                  {slice.label}
                </span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--rf-text-muted)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                {slice.pct}
              </span>
            </div>

            <span
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--rf-navy-primary)",
              }}
              className="font-mono tabular-nums"
            >
              {slice.count.toLocaleString("en-US")}
            </span>

            <span style={{ fontSize: "11px", color: "var(--rf-text-secondary)" }}>
              {slice.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
