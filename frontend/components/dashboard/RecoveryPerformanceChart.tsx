"use client";

import React, { useState, useMemo } from "react";
import { PerformanceChartPoint, PerformanceTimeframes } from "@/lib/types/dashboard";

export interface RecoveryPerformanceChartProps {
  timeframes?: PerformanceTimeframes;
  points?: PerformanceChartPoint[];
  isHistoricalLive?: boolean;
}

const DEFAULT_TIMEFRAMES: PerformanceTimeframes = {
  "7D": [
    { date: "Day 1", attempts: 54, recovered: 41, rate: "75.9%" },
    { date: "Day 2", attempts: 58, recovered: 44, rate: "75.9%" },
    { date: "Day 3", attempts: 55, recovered: 42, rate: "76.4%" },
    { date: "Day 4", attempts: 62, recovered: 48, rate: "77.4%" },
    { date: "Day 5", attempts: 60, recovered: 46, rate: "76.7%" },
    { date: "Day 6", attempts: 64, recovered: 49, rate: "76.6%" },
    { date: "Day 7", attempts: 66, recovered: 51, rate: "77.2%" },
  ],
  "30D": [
    { date: "Interval 1", attempts: 38, recovered: 26, rate: "68.4%" },
    { date: "Interval 2", attempts: 44, recovered: 32, rate: "72.7%" },
    { date: "Interval 3", attempts: 41, recovered: 30, rate: "73.1%" },
    { date: "Interval 4", attempts: 52, recovered: 39, rate: "75.0%" },
    { date: "Interval 5", attempts: 48, recovered: 36, rate: "75.0%" },
    { date: "Interval 6", attempts: 58, recovered: 44, rate: "75.8%" },
    { date: "Interval 7", attempts: 54, recovered: 41, rate: "75.9%" },
    { date: "Interval 8", attempts: 62, recovered: 48, rate: "77.4%" },
    { date: "Interval 9", attempts: 66, recovered: 51, rate: "77.2%" },
  ],
  "90D": [
    { date: "Interval 1", attempts: 220, recovered: 145, rate: "65.9%" },
    { date: "Interval 2", attempts: 245, recovered: 168, rate: "68.6%" },
    { date: "Interval 3", attempts: 280, recovered: 198, rate: "70.7%" },
    { date: "Interval 4", attempts: 310, recovered: 225, rate: "72.6%" },
    { date: "Interval 5", attempts: 350, recovered: 259, rate: "74.0%" },
    { date: "Interval 6", attempts: 390, recovered: 292, rate: "74.9%" },
    { date: "Interval 7", attempts: 420, recovered: 318, rate: "75.7%" },
  ],
};

export const RecoveryPerformanceChart: React.FC<RecoveryPerformanceChartProps> = ({
  timeframes = DEFAULT_TIMEFRAMES,
  points,
  isHistoricalLive = false,
}) => {
  const [range, setRange] = useState<"7D" | "30D" | "90D">("30D");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const activeTimeframe = timeframes || DEFAULT_TIMEFRAMES;
  const dataPoints =
    points && points.length > 0 && range === "30D"
      ? points
      : activeTimeframe[range] || activeTimeframe["30D"] || DEFAULT_TIMEFRAMES["30D"];

  // Calculate cumulative summary for the current active range
  const rangeSummary = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) {
      return { totalAttempts: 0, totalRecovered: 0, avgRate: "0.0%" };
    }
    const totalAttempts = dataPoints.reduce((sum, p) => sum + (p.attempts || 0), 0);
    const totalRecovered = dataPoints.reduce((sum, p) => sum + (p.recovered || 0), 0);
    const avgRate =
      totalAttempts > 0
        ? `${((totalRecovered / totalAttempts) * 100).toFixed(1)}%`
        : "0.0%";

    return { totalAttempts, totalRecovered, avgRate };
  }, [dataPoints]);

  // SVG coordinate calculations
  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const pointsCount = dataPoints.length;
  const maxVal = Math.max(80, ...dataPoints.map((d) => (d.attempts || 0) * 1.15));

  const getX = (index: number) =>
    paddingX + (index / Math.max(1, pointsCount - 1)) * (width - paddingX * 2);

  const getY = (val: number) =>
    height - paddingY - (val / maxVal) * (height - paddingY * 2);

  // Build SVG path strings
  const attemptsPath =
    pointsCount > 0
      ? dataPoints
          .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)},${getY(d.attempts || 0)}`)
          .join(" ")
      : "";

  const recoveredPath =
    pointsCount > 0
      ? dataPoints
          .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)},${getY(d.recovered || 0)}`)
          .join(" ")
      : "";

  const recoveredAreaPath =
    pointsCount > 0
      ? `${recoveredPath} L ${getX(pointsCount - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`
      : "";
  const attemptsAreaPath =
    pointsCount > 0
      ? `${attemptsPath} L ${getX(pointsCount - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`
      : "";

  const isHovering = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < pointsCount;
  const hoveredPoint = isHovering ? dataPoints[hoverIndex] : null;

  // Dynamic axis grid tick values
  const yTicks =
    maxVal > 250
      ? [0, 100, 200, 300, 400]
      : maxVal > 100
      ? [0, 50, 100, 150]
      : [0, 20, 40, 60, 80];

  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      className="rf-chart-container"
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--rf-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Recovery Performance
            </span>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 650,
                padding: "1px 6px",
                borderRadius: "var(--rf-radius-badge)",
                backgroundColor: isHistoricalLive
                  ? "var(--rf-emerald-surface)"
                  : "var(--rf-canvas)",
                color: isHistoricalLive
                  ? "var(--rf-emerald-text)"
                  : "var(--rf-text-muted)",
                border: `1px solid ${
                  isHistoricalLive
                    ? "var(--rf-emerald-border)"
                    : "var(--rf-border)"
                }`,
              }}
              className="font-mono"
            >
              {isHistoricalLive ? "LIVE TELEMETRY" : "SANDBOX BASELINE"}
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
            Autonomous retry orchestration vs manual rescue yield
          </span>
        </div>

        {/* Controls: Legend & Timeframe Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Legends */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  backgroundColor: "var(--rf-cyan)",
                }}
              />
              <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)", fontWeight: 550 }}>
                Attempts
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  backgroundColor: "var(--rf-emerald)",
                }}
              />
              <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)", fontWeight: 550 }}>
                Successful Recoveries
              </span>
            </div>
          </div>

          {/* Timeframe Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--rf-canvas)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
              padding: "2px",
            }}
          >
            {(["7D", "30D", "90D"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setRange(t);
                  setHoverIndex(null);
                }}
                style={{
                  padding: "3px 10px",
                  fontSize: "11.5px",
                  fontWeight: range === t ? 650 : 500,
                  backgroundColor: range === t ? "var(--rf-surface)" : "transparent",
                  color: range === t ? "var(--rf-navy-primary)" : "var(--rf-text-muted)",
                  border: range === t ? "1px solid var(--rf-border)" : "1px solid transparent",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 100ms ease",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        style={{
          padding: "20px 20px 14px 20px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Dynamic Period Summary / Hover Tooltip Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            backgroundColor: "var(--rf-surface-subtle)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-control)",
            marginBottom: "12px",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--rf-text-muted)" }}>
              {isHovering ? "Selected Period:" : `${range} Summary:`}
            </span>
            <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
              {isHovering ? `${hoveredPoint?.date} (${range})` : `Cumulative (${range})`}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div>
              <span style={{ color: "var(--rf-text-muted)" }}>
                {isHovering ? "Attempts: " : "Total Attempts: "}
              </span>
              <span style={{ fontWeight: 700, color: "var(--rf-cyan-text)" }} className="font-mono tabular-nums">
                {isHovering ? hoveredPoint?.attempts : rangeSummary.totalAttempts}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--rf-text-muted)" }}>
                {isHovering ? "Recovered: " : "Total Recovered: "}
              </span>
              <span style={{ fontWeight: 700, color: "var(--rf-emerald-text)" }} className="font-mono tabular-nums">
                {isHovering ? hoveredPoint?.recovered : rangeSummary.totalRecovered}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--rf-text-muted)" }}>
                {isHovering ? "Conversion Rate: " : "Aggregate Rate: "}
              </span>
              <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono tabular-nums">
                {isHovering ? hoveredPoint?.rate : rangeSummary.avgRate}
              </span>
            </div>
          </div>
        </div>

        {/* SVG Visualization or Empty State */}
        {pointsCount === 0 ? (
          <div
            style={{
              width: "100%",
              height: "190px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--rf-text-muted)",
              fontSize: "13px",
            }}
          >
            No recovery performance records for this timeframe.
          </div>
        ) : (
          <div style={{ width: "100%", height: "190px", position: "relative" }}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
              {/* Gridlines */}
              {yTicks.map((val) => (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={getY(val)}
                    x2={width - paddingX}
                    y2={getY(val)}
                    stroke="var(--rf-border)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingX - 10}
                    y={getY(val) + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="var(--rf-text-muted)"
                    fontFamily="var(--font-jetbrains-mono)"
                  >
                    {val}
                  </text>
                </g>
              ))}

              {/* Attempts Area & Line (Cyan) */}
              <path d={attemptsAreaPath} fill="rgba(21, 151, 211, 0.05)" />
              <path
                d={attemptsPath}
                fill="none"
                stroke="var(--rf-cyan)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Recovered Area & Line (Emerald) */}
              <path d={recoveredAreaPath} fill="rgba(0, 168, 120, 0.07)" />
              <path
                d={recoveredPath}
                fill="none"
                stroke="var(--rf-emerald)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Data Dots & Hover trigger regions */}
              {dataPoints.map((d, i) => {
                const cx = getX(i);
                const cyRec = getY(d.recovered || 0);
                const cyAtt = getY(d.attempts || 0);
                const isHovered = hoverIndex === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                    onClick={() => setHoverIndex(i)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Invisible broad hover target */}
                    <rect
                      x={cx - 15}
                      y={0}
                      width={30}
                      height={height}
                      fill="transparent"
                    />

                    {/* Vertical hover guide */}
                    {isHovered && (
                      <line
                        x1={cx}
                        y1={paddingY}
                        x2={cx}
                        y2={height - paddingY}
                        stroke="var(--rf-navy-primary)"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.4"
                      />
                    )}

                    {/* Cyan Attempt Point */}
                    <circle
                      cx={cx}
                      cy={cyAtt}
                      r={isHovered ? 4.5 : 3}
                      fill="var(--rf-surface)"
                      stroke="var(--rf-cyan)"
                      strokeWidth={2}
                    />

                    {/* Emerald Recovered Point */}
                    <circle
                      cx={cx}
                      cy={cyRec}
                      r={isHovered ? 5 : 3.5}
                      fill="var(--rf-emerald)"
                      stroke="var(--rf-surface)"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {dataPoints.map((d, i) => (
                <text
                  key={i}
                  x={getX(i)}
                  y={height - 2}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--rf-text-muted)"
                  fontFamily="var(--font-jetbrains-mono)"
                >
                  {d.date}
                </text>
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
