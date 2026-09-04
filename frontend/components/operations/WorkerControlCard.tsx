"use client";

import React from "react";
import Link from "next/link";
import { WorkerControlSummary } from "@/lib/types/operations";
import { Badge } from "@/components/ui/Badge";
import { Server, Lock } from "lucide-react";

export interface WorkerControlCardProps {
  workers: WorkerControlSummary;
}

export const WorkerControlCard: React.FC<WorkerControlCardProps> = ({ workers }) => {
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
          <Server size={16} color="var(--rf-navy-primary)" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
            Worker Fleet Registry
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Badge
            status={workers.onlineCount > 0 ? "OPERATIONAL" : "FAILED"}
            label={`${workers.onlineCount} / ${workers.totalWorkers} ONLINE`}
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
              REGISTERED WORKERS
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {workers.totalWorkers} Nodes
            </div>
          </div>

          <div style={{ backgroundColor: "var(--rf-canvas)", padding: "10px", borderRadius: "6px", border: "1px solid var(--rf-border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
              HEALTHY HEARTBEATS
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-emerald)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {workers.onlineCount} Active
            </div>
          </div>

          <div style={{ backgroundColor: "var(--rf-canvas)", padding: "10px", borderRadius: "6px", border: "1px solid var(--rf-border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
              IN-FLIGHT LEASES
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {workers.activeJobs} Jobs
            </div>
          </div>
        </div>

        {/* Read-only notice */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            backgroundColor: "rgba(16, 42, 67, 0.03)",
            border: "1px dashed var(--rf-border)",
            borderRadius: "6px",
            fontSize: "11px",
            color: "var(--rf-text-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={13} style={{ flexShrink: 0 }} />
            <span>
              <strong>WORKER RESTART/STOP CONTROLS NOT EXPOSED:</strong> Fleet processes are orchestrated
              via container supervisors. Individual worker drain is available in Worker detail.
            </span>
          </div>

          <Link
            href="/workers"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--rf-cyan)",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
              marginLeft: "12px",
            }}
          >
            Workers Fleet →
          </Link>
        </div>
      </div>
    </div>
  );
};
