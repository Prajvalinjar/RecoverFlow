"use client";

import React from "react";
import { Server, Cpu, Layers, ShieldCheck, Database } from "lucide-react";
import { TelemetryRailData } from "@/lib/types/dashboard";

export interface BottomTelemetryRailProps {
  telemetry?: TelemetryRailData;
}

const DEFAULT_TELEMETRY: TelemetryRailData = {
  provider: {
    label: "PROVIDER",
    value: "AVAILABLE",
    subtext: "Razorpay Gateway (Sandbox)",
    status: "healthy",
    isEmerald: true,
  },
  workers: {
    label: "WORKERS",
    value: "8 / 8 ONLINE",
    subtext: "Lease timeout: 450ms",
    status: "healthy",
    isEmerald: true,
  },
  queue: {
    label: "QUEUE",
    value: "4 PENDING",
    subtext: "Anti-starvation boost active",
    status: "healthy",
    isCyan: true,
  },
  circuitBreaker: {
    label: "CIRCUIT BREAKER",
    value: "CLOSED (HEALTHY)",
    subtext: "Error rate: 0.04%",
    status: "healthy",
    isEmerald: true,
  },
  ledger: {
    label: "LEDGER",
    value: "POSTGRESQL ACTIVE",
    subtext: "Atomic skip-locked claims",
    status: "neutral",
  },
};

export const BottomTelemetryRail: React.FC<BottomTelemetryRailProps> = ({
  telemetry = DEFAULT_TELEMETRY,
}) => {
  const t = telemetry || DEFAULT_TELEMETRY;

  const items = [
    {
      ...t.provider,
      icon: <Server size={14} color="var(--rf-emerald)" />,
    },
    {
      ...t.workers,
      icon: <Cpu size={14} color="var(--rf-emerald)" />,
    },
    {
      ...t.queue,
      icon: <Layers size={14} color="var(--rf-cyan)" />,
    },
    {
      ...t.circuitBreaker,
      icon: <ShieldCheck size={14} color="var(--rf-emerald)" />,
    },
    {
      ...t.ledger,
      icon: <Database size={14} color="var(--rf-text-muted)" />,
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        overflow: "hidden",
      }}
      className="rf-telemetry-strip"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div
            key={idx}
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              borderRight: isLast ? "none" : "1px solid var(--rf-border)",
            }}
            className="rf-telemetry-cell"
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--rf-radius-control)",
                backgroundColor: "var(--rf-canvas)",
                border: "1px solid var(--rf-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    color: "var(--rf-text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: item.isEmerald
                      ? "var(--rf-emerald-text)"
                      : item.isCyan
                      ? "var(--rf-cyan-text)"
                      : "var(--rf-navy-primary)",
                  }}
                  className="font-mono"
                >
                  {item.value}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--rf-text-secondary)" }}>
                {item.subtext}
              </span>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @media (max-width: 1100px) {
          .rf-telemetry-strip {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .rf-telemetry-cell {
            border-bottom: 1px solid var(--rf-border);
          }
          .rf-telemetry-cell:nth-child(2n) {
            border-right: none !important;
          }
        }
        @media (max-width: 600px) {
          .rf-telemetry-strip {
            grid-template-columns: 1fr !important;
          }
          .rf-telemetry-cell {
            border-right: none !important;
          }
        }
      `}</style>
    </div>
  );
};
