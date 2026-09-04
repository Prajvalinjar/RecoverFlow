"use client";

import React from "react";
import { AnalyticsTimeframe, AnalyticsTimeframeComparisonItem } from "@/lib/types/analytics";
import { TrendingUp, BarChart3 } from "lucide-react";

export interface RecoveryPerformanceProps {
  comparisonData: AnalyticsTimeframeComparisonItem[];
  selectedTimeframe: AnalyticsTimeframe;
  onSelectTimeframe: (tf: AnalyticsTimeframe) => void;
}

export const RecoveryPerformance: React.FC<RecoveryPerformanceProps> = ({
  comparisonData,
  selectedTimeframe,
  onSelectTimeframe,
}) => {
  const maxAttempts = Math.max(...comparisonData.map((d) => d.attempts));

  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
      className="rf-recovery-performance-section"
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Recovery Performance
            </h2>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: "var(--rf-warning-text)",
                backgroundColor: "var(--rf-warning-surface)",
                border: "1px solid var(--rf-warning-border)",
                padding: "2px 6px",
                borderRadius: "var(--rf-radius-badge)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              SANDBOX BASELINE
            </span>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--rf-text-secondary)", marginTop: "2px" }}>
            Verified aggregate recovery evaluation across standard observation horizons. Click any row to focus view.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "4px",
                backgroundColor: "#CBD5E1",
                borderRadius: "1px",
              }}
            />
            <span style={{ color: "var(--rf-text-secondary)" }}>Attempts Pool</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "4px",
                backgroundColor: "var(--rf-emerald)",
                borderRadius: "1px",
              }}
            />
            <span style={{ color: "var(--rf-text-secondary)" }}>Verified Recovered</span>
          </div>
        </div>
      </div>

      {/* Analytical Comparison Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {comparisonData.map((item) => {
          const isSelected = item.timeframe === selectedTimeframe;
          // Relative bar scale relative to maximum 2,215 attempts (min 25% width for visual clarity)
          const attemptsWidthPct = Math.max(28, Math.round((item.attempts / maxAttempts) * 100));

          return (
            <div
              key={item.timeframe}
              onClick={() => onSelectTimeframe(item.timeframe)}
              style={{
                borderRadius: "var(--rf-radius-control)",
                border: isSelected ? "1.5px solid var(--rf-cyan)" : "1px solid var(--rf-border-subtle)",
                backgroundColor: isSelected ? "var(--rf-surface-light-blue)" : "var(--rf-surface-subtle)",
                padding: "16px 18px",
                cursor: "pointer",
                transition: "all 120ms ease",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectTimeframe(item.timeframe);
                }
              }}
            >
              {/* Row Header & Primary Metrics */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                {/* Timeframe Tag */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "140px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "42px",
                      height: "28px",
                      borderRadius: "var(--rf-radius-control)",
                      backgroundColor: isSelected ? "var(--rf-navy-primary)" : "var(--rf-surface)",
                      color: isSelected ? "#FFFFFF" : "var(--rf-navy-primary)",
                      border: `1px solid ${isSelected ? "var(--rf-navy-primary)" : "var(--rf-border)"}`,
                      fontSize: "13px",
                      fontWeight: 750,
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    {item.timeframe}
                  </span>

                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
                      {item.label}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--rf-cyan-text)",
                          letterSpacing: "0.04em",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}
                      >
                        ACTIVE FOCUS
                      </span>
                    )}
                  </div>
                </div>

                {/* Metric Columns */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Attempts */}
                  <div style={{ minWidth: "90px" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "var(--rf-text-muted)",
                        letterSpacing: "0.04em",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}
                    >
                      ATTEMPTS
                    </span>
                    <span
                      style={{
                        fontSize: "17px",
                        fontWeight: 750,
                        color: "var(--rf-navy-primary)",
                      }}
                      className="font-mono tabular-nums"
                    >
                      {item.attempts.toLocaleString("en-US")}
                    </span>
                  </div>

                  {/* Recovered */}
                  <div style={{ minWidth: "90px" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "var(--rf-text-muted)",
                        letterSpacing: "0.04em",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}
                    >
                      RECOVERED
                    </span>
                    <span
                      style={{
                        fontSize: "17px",
                        fontWeight: 750,
                        color: "var(--rf-emerald-text)",
                      }}
                      className="font-mono tabular-nums"
                    >
                      {item.recovered.toLocaleString("en-US")}
                    </span>
                  </div>

                  {/* Rate */}
                  <div style={{ minWidth: "85px" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "var(--rf-text-muted)",
                        letterSpacing: "0.04em",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}
                    >
                      RATE
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "var(--rf-radius-badge)",
                        backgroundColor: "var(--rf-emerald-surface)",
                        border: "1px solid var(--rf-emerald-border)",
                        color: "var(--rf-emerald-text)",
                        fontSize: "13.5px",
                        fontWeight: 800,
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}
                      className="tabular-nums"
                    >
                      {item.rate}
                    </span>
                  </div>

                  {/* Revenue */}
                  <div style={{ minWidth: "100px", textAlign: "right" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "var(--rf-text-muted)",
                        letterSpacing: "0.04em",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}
                    >
                      REVENUE
                    </span>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 750,
                        color: "var(--rf-navy-primary)",
                      }}
                      className="font-mono tabular-nums"
                    >
                      {item.recoveredRevenue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proportional Bar Visualizer */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    borderRadius: "4px",
                    backgroundColor: "var(--rf-border-subtle)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                  role="progressbar"
                  aria-label={`${item.timeframe} attempts and recovery rate`}
                  aria-valuenow={item.rateNum}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {/* Total Attempts Envelope */}
                  <div
                    style={{
                      width: `${attemptsWidthPct}%`,
                      height: "100%",
                      backgroundColor: "#CBD5E1",
                      borderRadius: "4px",
                      position: "relative",
                      overflow: "hidden",
                      transition: "width 300ms ease",
                    }}
                  >
                    {/* Nested Recovered Emerald Portion */}
                    <div
                      style={{
                        width: `${item.rateNum}%`,
                        height: "100%",
                        backgroundColor: "var(--rf-emerald)",
                        borderRadius: "4px",
                        transition: "width 300ms ease",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10.5px",
                    color: "var(--rf-text-muted)",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <span>
                    Proportional attempt scale: {item.attempts.toLocaleString("en-US")} total attempts
                  </span>
                  <span>
                    Verified conversion: {item.recovered.toLocaleString("en-US")} of {item.attempts.toLocaleString("en-US")} ({item.rate})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytical Horizon Summary Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "var(--rf-radius-control)",
          backgroundColor: "var(--rf-surface-subtle)",
          border: "1px solid var(--rf-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--rf-text-secondary)" }}>
          <TrendingUp size={15} color="var(--rf-emerald)" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: "var(--rf-navy-primary)" }}>Longitudinal Yield Corridor: </strong>
            Recovery conversion remains tightly bounded between <strong>72.5%</strong> and <strong>76.6%</strong> across 7D, 30D, and 90D horizons.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--rf-cyan-text)", fontWeight: 650 }}>
          <BarChart3 size={14} />
          <span>Verified Aggregate Model</span>
        </div>
      </div>
    </div>
  );
};
