"use client";

import React from "react";
import { CircuitStateDetail } from "@/lib/types/operations";
import { Badge } from "@/components/ui/Badge";
import { Activity, Lock } from "lucide-react";

export interface CircuitBreakerCardProps {
  circuit: CircuitStateDetail;
}

export const CircuitBreakerCard: React.FC<CircuitBreakerCardProps> = ({ circuit }) => {
  const isClosed = circuit.state === "CLOSED";

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
          flexWrap: "wrap",
          gap: "8px",
          backgroundColor: "var(--rf-canvas)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={16} color="var(--rf-navy-primary)" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
            Circuit Breaker Safeguard
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Badge
            status={isClosed ? "OPERATIONAL" : "FAILED"}
            label={circuit.state}
          />
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
            READ ONLY
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            fontSize: "12px",
          }}
        >
          <div style={{ backgroundColor: "var(--rf-canvas)", padding: "10px", borderRadius: "6px", border: "1px solid var(--rf-border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
              FAILURE THRESHOLD
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {circuit.failureThreshold} Consecutive
            </div>
          </div>

          <div style={{ backgroundColor: "var(--rf-canvas)", padding: "10px", borderRadius: "6px", border: "1px solid var(--rf-border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
              RECOVERY TIMEOUT
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {circuit.recoveryTimeoutSeconds}s Window
            </div>
          </div>

          <div style={{ backgroundColor: "var(--rf-canvas)", padding: "10px", borderRadius: "6px", border: "1px solid var(--rf-border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
              HALF-OPEN PROBE
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {circuit.probeQuota} Max Probe
            </div>
          </div>
        </div>

        {/* Read-only notification */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            backgroundColor: "rgba(16, 42, 67, 0.03)",
            border: "1px dashed var(--rf-border)",
            borderRadius: "6px",
            fontSize: "11px",
            color: "var(--rf-text-muted)",
          }}
        >
          <Lock size={13} style={{ flexShrink: 0 }} />
          <span>
            <strong>CONTROL ACTION NOT EXPOSED:</strong> Circuit transitions are fully autonomous.
            The backend exposes state inspection via <code>/api/v1/operations/providers/circuit</code> only.
          </span>
        </div>
      </div>
    </div>
  );
};
