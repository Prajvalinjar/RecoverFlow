"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { RevenueProtectionData } from "@/lib/types/dashboard";

export interface RevenueProtectionSectionProps {
  protectionData?: RevenueProtectionData;
}

const DEFAULT_PROTECTION: RevenueProtectionData = {
  revenueAtRisk: "$245,680",
  revenueRecovered: "$182,450",
  protectionRate: "74.26% PROTECTED",
  recoveryPercentageLabel: "(+74.3%)",
  breakdown: [
    {
      label: "Autonomous Orchestration",
      amount: "$158,200",
      pct: "64.4%",
      color: "var(--rf-emerald)",
      desc: "Idempotent backoff & multi-worker execution",
    },
    {
      label: "Dynamic Payment Link Fallback",
      amount: "$24,250",
      pct: "9.9%",
      color: "var(--rf-cyan)",
      desc: "Customer self-service SMS/WhatsApp recovery",
    },
    {
      label: "Active In-Flight Pipeline",
      amount: "$41,300",
      pct: "16.8%",
      color: "var(--rf-blue-queued)",
      desc: "Scheduled for next retry slot",
    },
    {
      label: "Terminal Loss (Hard Declines)",
      amount: "$21,930",
      pct: "8.9%",
      color: "#94A3B8",
      desc: "Invalid credentials or closed accounts",
    },
  ],
  barWidths: {
    autonomous: "64.4%",
    dynamicLink: "9.9%",
    inFlight: "16.8%",
    terminalLoss: "8.9%",
  },
};

export const RevenueProtectionSection: React.FC<RevenueProtectionSectionProps> = ({
  protectionData = DEFAULT_PROTECTION,
}) => {
  const data = protectionData || DEFAULT_PROTECTION;

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
      className="rf-protection-container"
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
              Revenue Protection
            </span>
            <span style={{ fontSize: "12px", color: "var(--rf-text-muted)" }}>
              • Capital Salvage Ratio
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
            Proportional recovery breakdown against gross failed GMV
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 8px",
            backgroundColor: "var(--rf-emerald-surface)",
            color: "var(--rf-emerald-text)",
            border: "1px solid var(--rf-emerald-border)",
            borderRadius: "var(--rf-radius-badge)",
            fontSize: "11px",
            fontWeight: 700,
          }}
          className="font-mono"
        >
          <ShieldCheck size={12} />
          <span>{data.protectionRate}</span>
        </div>
      </div>

      {/* Main Comparative Values */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1px",
            backgroundColor: "var(--rf-border)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-control)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--rf-surface)",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 650,
                color: "var(--rf-text-muted)",
                textTransform: "uppercase",
              }}
            >
              Revenue At Risk (Failed GMV)
            </span>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
              }}
              className="tabular-nums font-mono"
            >
              {data.revenueAtRisk}
            </span>
          </div>

          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "var(--rf-surface-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 650,
                color: "var(--rf-emerald-text)",
                textTransform: "uppercase",
              }}
            >
              Net Revenue Recovered
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "var(--rf-emerald-text)",
                }}
                className="tabular-nums font-mono"
              >
                {data.revenueRecovered}
              </span>
              <span style={{ fontSize: "11.5px", color: "var(--rf-emerald-text)", fontWeight: 600 }}>
                {data.recoveryPercentageLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Proportional Segmented Bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              height: "10px",
              width: "100%",
              backgroundColor: "var(--rf-canvas)",
              borderRadius: "4px",
              display: "flex",
              overflow: "hidden",
              border: "1px solid var(--rf-border)",
            }}
          >
            <div style={{ width: data.barWidths.autonomous, backgroundColor: "var(--rf-emerald)" }} />
            <div style={{ width: data.barWidths.dynamicLink, backgroundColor: "var(--rf-cyan)" }} />
            <div style={{ width: data.barWidths.inFlight, backgroundColor: "var(--rf-blue-queued)" }} />
            <div style={{ width: data.barWidths.terminalLoss, backgroundColor: "#CBD5E1" }} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--rf-text-muted)",
            }}
            className="font-mono"
          >
            <span>$0.00</span>
            <span>{data.revenueAtRisk} (100%)</span>
          </div>
        </div>

        {/* Proportional Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.breakdown.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: "var(--rf-radius-control)",
                backgroundColor: "var(--rf-surface-subtle)",
                border: "1px solid var(--rf-border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "2px",
                    backgroundColor: row.color,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--rf-navy-primary)" }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }}>
                    {row.desc}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}
                  className="font-mono tabular-nums"
                >
                  {row.amount}
                </span>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 650,
                    color: "var(--rf-text-secondary)",
                    minWidth: "40px",
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
