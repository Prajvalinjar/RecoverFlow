"use client";

import React from "react";
import { Badge } from "../ui/Badge";
import { Server, Activity, ShieldCheck, Clock } from "lucide-react";
import { DashboardHeaderMeta } from "@/lib/types/dashboard";

export interface DashboardHeaderProps {
  headerMeta?: DashboardHeaderMeta;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ headerMeta }) => {
  const meta: DashboardHeaderMeta = headerMeta || {
    systemStatus: "OPERATIONAL",
    environmentLabel: "TEST / SANDBOX",
    serverRegion: "PROD-US-EAST-1",
    providerGateway: "RAZORPAY SANDBOX",
    circuitState: "CIRCUIT: CLOSED",
    lastSyncedText: "SYNCED: RECENT",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        paddingBottom: "20px",
        borderBottom: "1px solid var(--rf-border)",
      }}
    >
      {/* Breadcrumb line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "var(--rf-text-muted)",
          textTransform: "uppercase",
        }}
      >
        <span>RECOVERFLOW</span>
        <span style={{ color: "#CBD5E1" }}>/</span>
        <span style={{ color: "var(--rf-text-secondary)" }}>COMMAND</span>
      </div>

      {/* Main Title Row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 750,
              color: "var(--rf-navy-primary)",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            Operations Command Center
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--rf-text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Autonomous payment recovery execution, queue orchestration & provider reliability
          </p>
        </div>

        {/* Environment & Live Telemetry Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "4px",
          }}
        >
          <Badge
            status={meta.systemStatus === "OPERATIONAL" ? "OPERATIONAL" : "DEGRADED"}
            label={meta.systemStatus === "OPERATIONAL" ? "SYSTEM OPERATIONAL" : "SYSTEM DEGRADED"}
            size="sm"
          />
          <Badge
            status={meta.environmentLabel === "LIVE DATABASE" ? "OPERATIONAL" : "SANDBOX"}
            label={meta.environmentLabel}
            dot={false}
            size="sm"
          />

          {/* Micro Environment Tokens */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 8px",
              backgroundColor: "var(--rf-surface)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-badge)",
              fontSize: "11px",
              color: "var(--rf-text-secondary)",
            }}
            className="font-mono"
          >
            <Server size={11} color="var(--rf-text-muted)" />
            <span>{meta.serverRegion}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 8px",
              backgroundColor: "var(--rf-surface)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-badge)",
              fontSize: "11px",
              color: "var(--rf-text-secondary)",
            }}
            className="font-mono"
          >
            <Activity size={11} color="var(--rf-cyan)" />
            <span>{meta.providerGateway}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 8px",
              backgroundColor: "var(--rf-emerald-surface)",
              border: "1px solid var(--rf-emerald-border)",
              borderRadius: "var(--rf-radius-badge)",
              fontSize: "11px",
              color: "var(--rf-emerald-text)",
              fontWeight: 600,
            }}
            className="font-mono"
          >
            <ShieldCheck size={11} color="var(--rf-emerald)" />
            <span>{meta.circuitState}</span>
          </div>

          {meta.lastSyncedText && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 8px",
                backgroundColor: "var(--rf-surface)",
                border: "1px solid var(--rf-border)",
                borderRadius: "var(--rf-radius-badge)",
                fontSize: "10.5px",
                color: "var(--rf-text-muted)",
              }}
              className="font-mono"
            >
              <Clock size={10} />
              <span>{meta.lastSyncedText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
