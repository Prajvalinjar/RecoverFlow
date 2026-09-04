"use client";

import React from "react";
import { AnalyticsExecutiveMetrics } from "@/lib/types/analytics";
import { ArrowUpRight, TrendingUp, CheckCircle2, ShieldCheck, Activity } from "lucide-react";

export interface AnalyticsMetricRailProps {
  metrics: AnalyticsExecutiveMetrics;
  timeframe: string;
}

export const AnalyticsMetricRail: React.FC<AnalyticsMetricRailProps> = ({
  metrics,
  timeframe,
}) => {
  const cards = [
    {
      label: "RECOVERY ATTEMPTS",
      value: metrics.attempts.toLocaleString("en-US"),
      subtext: metrics.subtextAttempts,
      icon: <Activity size={16} color="var(--rf-navy-primary)" />,
      badge: `${timeframe} Window`,
      isHighlight: false,
    },
    {
      label: "RECOVERED CASES",
      value: metrics.recovered.toLocaleString("en-US"),
      subtext: metrics.subtextRecovered,
      icon: <CheckCircle2 size={16} color="var(--rf-emerald)" />,
      badge: "Verified Captured",
      isHighlight: true,
      color: "var(--rf-emerald-text)",
    },
    {
      label: "RECOVERY RATE",
      value: metrics.recoveryRate,
      subtext: metrics.subtextRate,
      icon: <TrendingUp size={16} color="var(--rf-emerald)" />,
      badge: "Autonomous Rate",
      isHighlight: true,
      color: "var(--rf-emerald-text)",
    },
    {
      label: "RECOVERED REVENUE",
      value: metrics.recoveredRevenue,
      subtext: metrics.subtextRevenue,
      icon: <ShieldCheck size={16} color="var(--rf-cyan)" />,
      badge: "Reconciled Yield",
      isHighlight: false,
      color: "var(--rf-cyan-text)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "14px",
      }}
      className="rf-analytics-metrics-rail"
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "12px",
            transition: "border-color 150ms ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--rf-text-muted)",
                letterSpacing: "0.06em",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              {card.label}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "var(--rf-radius-control)",
                backgroundColor: "var(--rf-canvas)",
                border: "1px solid var(--rf-border-subtle)",
              }}
            >
              {card.icon}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 800,
                color: card.color || "var(--rf-navy-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
              className="tabular-nums font-mono"
            >
              {card.value}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "6px",
                fontSize: "12px",
                color: "var(--rf-text-secondary)",
              }}
            >
              {card.isHighlight && (
                <ArrowUpRight size={13} color="var(--rf-emerald)" style={{ flexShrink: 0 }} />
              )}
              <span>{card.subtext}</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "8px",
              borderTop: "1px solid var(--rf-border-subtle)",
              fontSize: "10.5px",
              color: "var(--rf-text-muted)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            <span>{card.badge}</span>
            <span>SANDBOX BASELINE</span>
          </div>
        </div>
      ))}
    </div>
  );
};
