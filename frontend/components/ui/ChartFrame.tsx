"use client";

import React from "react";

export interface ChartLegendItem {
  label: string;
  color: string;
  value?: string | number;
}

export interface ChartFrameProps {
  title: string;
  subtitle?: string;
  metric?: string;
  metricLabel?: string;
  legends?: ChartLegendItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}

export const ChartFrame: React.FC<ChartFrameProps> = ({
  title,
  subtitle,
  metric,
  metricLabel,
  legends = [],
  actions,
  children,
  height = "260px",
  className = "",
}) => {
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
      className={`rf-chart-workspace ${className}`}
    >
      {/* Header with Title, Metrics, and Actions */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--rf-border-subtle)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3
              style={{
                fontSize: "14.5px",
                fontWeight: 650,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <span style={{ fontSize: "12px", color: "var(--rf-text-muted)" }}>
                • {subtitle}
              </span>
            )}
          </div>
          {metric && (
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "var(--rf-navy-primary)",
                  letterSpacing: "-0.03em",
                }}
                className="tabular-nums"
              >
                {metric}
              </span>
              {metricLabel && (
                <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
                  {metricLabel}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Legends */}
          {legends.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {legends.map((legend, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "2px",
                      backgroundColor: legend.color,
                    }}
                  />
                  <span style={{ color: "var(--rf-text-secondary)", fontWeight: 500 }}>
                    {legend.label}
                  </span>
                  {legend.value !== undefined && (
                    <span
                      style={{
                        fontWeight: 650,
                        color: "var(--rf-navy-primary)",
                        marginLeft: "2px",
                      }}
                      className="tabular-nums"
                    >
                      {legend.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {actions && <div>{actions}</div>}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        style={{
          padding: "16px 20px",
          height,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};
