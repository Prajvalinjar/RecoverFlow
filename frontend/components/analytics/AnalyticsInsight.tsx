"use client";

import React from "react";
import { AnalyticsDeterministicInsight } from "@/lib/types/analytics";
import { Lightbulb, Info } from "lucide-react";

export interface AnalyticsInsightProps {
  insights: AnalyticsDeterministicInsight[];
}

export const AnalyticsInsight: React.FC<AnalyticsInsightProps> = ({ insights }) => {
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
              Failure → Recovery Signals
            </h2>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                backgroundColor: "var(--rf-canvas)",
                border: "1px solid var(--rf-border)",
                padding: "2px 6px",
                borderRadius: "var(--rf-radius-badge)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              DETERMINISTIC ANALYSIS
            </span>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--rf-text-secondary)", marginTop: "2px" }}>
            Empirical policy observations derived from failure taxonomy and recovery attempt correlations.
          </p>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            color: "var(--rf-text-muted)",
          }}
        >
          <Info size={13} />
          <span>Non-synthetic telemetry derivation</span>
        </div>
      </div>

      {/* Insight Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {insights.map((ins) => (
          <div
            key={ins.id}
            style={{
              padding: "16px",
              borderRadius: "var(--rf-radius-control)",
              backgroundColor: "var(--rf-surface-subtle)",
              border: "1px solid var(--rf-border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lightbulb size={14} color={ins.badgeColor} />
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: ins.badgeColor,
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  letterSpacing: "0.04em",
                }}
              >
                {ins.tag}
              </span>
            </div>

            <h3
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {ins.title}
            </h3>

            <p style={{ fontSize: "12px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              {ins.observation}
            </p>

            <div
              style={{
                marginTop: "auto",
                paddingTop: "8px",
                borderTop: "1px solid var(--rf-border-subtle)",
                fontSize: "11.5px",
                color: "var(--rf-navy-primary)",
                lineHeight: 1.45,
                fontWeight: 500,
              }}
            >
              <strong style={{ fontWeight: 650 }}>Policy Action: </strong>
              {ins.implication}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
