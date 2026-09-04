"use client";

import React from "react";
import { OperationsOverviewBundle } from "@/lib/types/operations";
import { Activity, Layers, Server, Radio, ShieldCheck, ShieldAlert } from "lucide-react";

export interface OperationsStateSummaryProps {
  overview: OperationsOverviewBundle;
}

export const OperationsStateSummary: React.FC<OperationsStateSummaryProps> = ({ overview }) => {
  const isPaused = overview.recovery.status === "PAUSED";
  const isNormalQueue = overview.queue.backpressureLevel === "NORMAL";
  const isClosedCircuit = overview.circuit.state === "CLOSED";

  const cards = [
    {
      title: "RECOVERY ENGINE",
      value: isPaused ? "PAUSED" : "OPERATIONAL",
      subtext: isPaused ? "Execution blocked" : "Processing allowed",
      statusColor: isPaused ? "var(--rf-danger)" : "var(--rf-emerald)",
      bgColor: isPaused ? "rgba(229, 72, 77, 0.06)" : "rgba(0, 178, 122, 0.06)",
      borderColor: isPaused ? "var(--rf-danger-border)" : "var(--rf-emerald-border)",
      icon: isPaused ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />,
    },
    {
      title: "QUEUE BACKPRESSURE",
      value: overview.queue.backpressureLevel,
      subtext: `${overview.queue.queuedDepth} queued / ${overview.queue.claimedLeases} claimed`,
      statusColor: isNormalQueue ? "var(--rf-emerald)" : "var(--rf-warning)",
      bgColor: isNormalQueue ? "rgba(0, 178, 122, 0.06)" : "rgba(245, 158, 11, 0.06)",
      borderColor: isNormalQueue ? "var(--rf-emerald-border)" : "var(--rf-warning-border)",
      icon: <Layers size={16} />,
    },
    {
      title: "WORKERS ONLINE",
      value: `${overview.workers.onlineCount} / ${overview.workers.totalWorkers}`,
      subtext: `${overview.workers.activeJobs} active worker leases`,
      statusColor: overview.workers.onlineCount > 0 ? "var(--rf-emerald)" : "var(--rf-danger)",
      bgColor: "rgba(0, 178, 122, 0.06)",
      borderColor: "var(--rf-emerald-border)",
      icon: <Server size={16} />,
    },
    {
      title: "PAYMENT PROVIDER",
      value: overview.providers.activeProvider.toUpperCase(),
      subtext: "Gateway Router",
      statusColor: "var(--rf-cyan)",
      bgColor: "rgba(21, 151, 211, 0.06)",
      borderColor: "var(--rf-cyan-border)",
      icon: <Radio size={16} />,
    },
    {
      title: "CIRCUIT BREAKER",
      value: overview.circuit.state,
      subtext: "Read-only safeguard",
      statusColor: isClosedCircuit ? "var(--rf-emerald)" : "var(--rf-danger)",
      bgColor: isClosedCircuit ? "rgba(0, 178, 122, 0.06)" : "rgba(229, 72, 77, 0.06)",
      borderColor: isClosedCircuit ? "var(--rf-emerald-border)" : "var(--rf-danger-border)",
      icon: <Activity size={16} />,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
        width: "100%",
      }}
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid var(--rf-border)",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            boxShadow: "0 1px 2px rgba(16, 42, 67, 0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--rf-text-muted)",
                letterSpacing: "0.06em",
              }}
            >
              {card.title}
            </span>
            <span
              style={{
                color: card.statusColor,
                display: "flex",
              }}
            >
              {card.icon}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.01em",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {card.value}
            </span>
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "var(--rf-text-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {card.subtext}
          </div>
        </div>
      ))}
    </div>
  );
};
