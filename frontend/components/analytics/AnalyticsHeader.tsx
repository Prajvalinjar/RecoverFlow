"use client";

import React from "react";
import { AnalyticsTimeframe } from "@/lib/types/analytics";
import { RefreshCw, Database } from "lucide-react";

export interface AnalyticsHeaderProps {
  timeframe: AnalyticsTimeframe;
  onTimeframeChange: (tf: AnalyticsTimeframe) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  dataMode: "SANDBOX BASELINE" | "BACKEND CONNECTED" | "LIVE DATABASE" | "SANDBOX SEED" | "EMPTY DATABASE";
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  timeframe,
  onTimeframeChange,
  isRefreshing,
  onRefresh,
  dataMode,
}) => {
  const timeframes: AnalyticsTimeframe[] = ["7D", "30D", "90D"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        paddingBottom: "20px",
        borderBottom: "1px solid var(--rf-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 750,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Recovery Analytics
            </h1>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 8px",
                borderRadius: "var(--rf-radius-badge)",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                letterSpacing: "0.04em",
                backgroundColor:
                  dataMode === "LIVE DATABASE"
                    ? "var(--rf-emerald-surface)"
                    : "var(--rf-warning-surface)",
                color:
                  dataMode === "LIVE DATABASE"
                    ? "var(--rf-emerald-text)"
                    : "var(--rf-warning-text)",
                border: `1px solid ${
                  dataMode === "LIVE DATABASE"
                    ? "var(--rf-emerald-border)"
                    : "var(--rf-warning-border)"
                }`,
              }}
            >
              <Database size={12} />
              {dataMode}
            </span>
          </div>

          <p
            style={{
              fontSize: "13.5px",
              color: "var(--rf-text-secondary)",
              marginTop: "4px",
            }}
          >
            Measure recovery performance, failure patterns, and execution efficiency.
          </p>
        </div>

        {/* Timeframe selector and Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "var(--rf-canvas)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
              padding: "2px",
            }}
            role="group"
            aria-label="Select analytics timeframe"
          >
            {timeframes.map((tf) => {
              const isActive = timeframe === tf;
              return (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "12.5px",
                    fontWeight: isActive ? 700 : 550,
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    backgroundColor: isActive ? "var(--rf-surface)" : "transparent",
                    color: isActive ? "var(--rf-navy-primary)" : "var(--rf-text-secondary)",
                    boxShadow: isActive ? "0 1px 3px rgba(16, 42, 67, 0.08)" : "none",
                  }}
                  aria-pressed={isActive}
                >
                  {tf}
                </button>
              );
            })}
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "var(--rf-radius-control)",
              border: "1px solid var(--rf-border)",
              backgroundColor: "var(--rf-surface)",
              color: "var(--rf-navy-primary)",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: isRefreshing ? "not-allowed" : "pointer",
              opacity: isRefreshing ? 0.7 : 1,
            }}
            aria-label="Refresh recovery analytics"
          >
            <RefreshCw
              size={13}
              style={{
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
