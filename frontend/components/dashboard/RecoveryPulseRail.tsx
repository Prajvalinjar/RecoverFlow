"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { OperationsPulseMetric } from "@/lib/types/dashboard";

export interface RecoveryPulseRailProps {
  metrics?: OperationsPulseMetric[];
}

const DEFAULT_METRICS: OperationsPulseMetric[] = [
  {
    label: "TOTAL CASES",
    value: "1,240",
    subtext: "+84 today",
  },
  {
    label: "ACTIVE RECOVERIES",
    value: "142",
    subtext: "in-flight pipeline",
    isCyan: true,
  },
  {
    label: "REVENUE AT RISK",
    value: "$245,680",
    subtext: "avg $198.12 / tx",
  },
  {
    label: "REVENUE RECOVERED",
    value: "$182,450",
    subtext: "+$34,120 (7D)",
    isEmerald: true,
    deltaIcon: true,
  },
  {
    label: "RECOVERY RATE",
    value: "74.26%",
    subtext: "+4.12% vs baseline",
    isEmerald: true,
    deltaIcon: true,
  },
  {
    label: "RECOVERY ATTEMPTS",
    value: "463",
    subtext: "verified attempts",
  },
];

export const RecoveryPulseRail: React.FC<RecoveryPulseRailProps> = ({
  metrics = DEFAULT_METRICS,
}) => {
  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        overflow: "hidden",
      }}
      className="rf-pulse-rail"
    >
      {metrics.map((item, idx) => {
        const isLast = idx === metrics.length - 1;
        return (
          <div
            key={idx}
            style={{
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              borderRight: isLast ? "none" : "1px solid var(--rf-border)",
            }}
            className="rf-pulse-cell"
          >
            {/* Upper label */}
            <span
              style={{
                fontSize: "11px",
                fontWeight: 650,
                letterSpacing: "0.06em",
                color: "var(--rf-text-muted)",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </span>

            {/* Metric Value */}
            <div
              style={{
                fontSize: "30px",
                fontWeight: 700,
                color: item.isEmerald
                  ? "var(--rf-emerald-text)"
                  : item.isCyan
                  ? "var(--rf-cyan-text)"
                  : "var(--rf-navy-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
              className="tabular-nums font-mono"
            >
              {item.value}
            </div>

            {/* Supporting Delta */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: item.isEmerald
                  ? "var(--rf-emerald-text)"
                  : "var(--rf-text-secondary)",
                fontWeight: 500,
              }}
            >
              {item.deltaIcon && <ArrowUpRight size={13} strokeWidth={2.5} />}
              <span>{item.subtext}</span>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @media (max-width: 1200px) {
          .rf-pulse-rail {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .rf-pulse-cell {
            border-bottom: 1px solid var(--rf-border);
          }
          .rf-pulse-cell:nth-child(3n) {
            border-right: none !important;
          }
          .rf-pulse-cell:nth-child(4),
          .rf-pulse-cell:nth-child(5),
          .rf-pulse-cell:nth-child(6) {
            border-bottom: none !important;
          }
        }
        @media (max-width: 680px) {
          .rf-pulse-rail {
            grid-template-columns: 1fr !important;
          }
          .rf-pulse-cell {
            border-right: none !important;
            border-bottom: 1px solid var(--rf-border) !important;
          }
          .rf-pulse-cell:last-child {
            border-bottom: none !important;
          }
        }
      `}</style>
    </div>
  );
};
