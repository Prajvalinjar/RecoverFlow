"use client";

import React from "react";
import { ShieldOff, Info } from "lucide-react";

export const EmergencyControlCard: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        border: "1px solid var(--rf-border)",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(16, 42, 67, 0.03)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--rf-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--rf-canvas)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldOff size={16} color="var(--rf-text-muted)" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
            Emergency Control
          </span>
        </div>

        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: "rgba(16, 42, 67, 0.06)",
            color: "var(--rf-text-muted)",
            letterSpacing: "0.05em",
          }}
        >
          NOT EXPOSED
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "12px 14px",
            backgroundColor: "rgba(16, 42, 67, 0.02)",
            border: "1px solid var(--rf-border)",
            borderRadius: "6px",
            fontSize: "12px",
            lineHeight: 1.5,
            color: "var(--rf-text-secondary)",
          }}
        >
          <Info size={16} style={{ color: "var(--rf-text-muted)", marginTop: "2px", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: "var(--rf-navy-primary)", marginBottom: "2px" }}>
              No Emergency Kill-Switch Endpoint Exposed
            </div>
            <div>
              No emergency control endpoint is currently exposed by the backend REST API. In accordance
              with RecoverFlow architectural governance, no decorative or non-functional emergency controls
              are rendered. Immediate execution halt can be achieved via <strong>Recovery Execution Control (Pause)</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
