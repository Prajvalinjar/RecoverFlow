"use client";

import React from "react";
import { AnalyticsDataQualityMeta } from "@/lib/types/analytics";
import { ShieldCheck, Database, Clock, FileText } from "lucide-react";

export interface DataQualityProps {
  quality: AnalyticsDataQualityMeta;
}

export const DataQuality: React.FC<DataQualityProps> = ({ quality }) => {
  const syncDate = new Date(quality.lastSync);
  const formattedSync = `${syncDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })} ${syncDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })} UTC`;

  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={16} color="var(--rf-emerald)" />
          <h2 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
            Telemetry & Data Quality Validation
          </h2>
        </div>

        <span
          style={{
            fontSize: "11px",
            color: "var(--rf-text-muted)",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          STRICT DETERMINISTIC TRANSPARENCY
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "var(--rf-radius-control)",
            backgroundColor: "var(--rf-surface-subtle)",
            border: "1px solid var(--rf-border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span style={{ fontSize: "10.5px", color: "var(--rf-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Database size={11} />
            DATA MODE
          </span>
          <span
            style={{
              fontSize: "12.5px",
              fontWeight: 750,
              color: quality.dataMode === "SANDBOX BASELINE" ? "var(--rf-warning-text)" : "var(--rf-emerald-text)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {quality.dataMode}
          </span>
        </div>

        <div
          style={{
            padding: "10px 12px",
            borderRadius: "var(--rf-radius-control)",
            backgroundColor: "var(--rf-surface-subtle)",
            border: "1px solid var(--rf-border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span style={{ fontSize: "10.5px", color: "var(--rf-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            <FileText size={11} />
            PRIMARY DATA SOURCE
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 650,
              color: "var(--rf-navy-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={quality.dataSource}
          >
            {quality.dataSource}
          </span>
        </div>

        <div
          style={{
            padding: "10px 12px",
            borderRadius: "var(--rf-radius-control)",
            backgroundColor: "var(--rf-surface-subtle)",
            border: "1px solid var(--rf-border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span style={{ fontSize: "10.5px", color: "var(--rf-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={11} />
            SYNCHRONIZED AT
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 650,
              color: "var(--rf-navy-primary)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {formattedSync}
          </span>
        </div>
      </div>

      <p style={{ fontSize: "11px", color: "var(--rf-text-muted)", lineHeight: 1.4 }}>
        Notice: In accordance with RecoverFlow Data Honesty standards, historical performance trends are labeled Sandbox Baseline and reflect deterministic testing benchmarks rather than real production customer records.
      </p>
    </div>
  );
};
