"use client";

import React from "react";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "pure" | "light-blue" | "subtle" | "tinted";
  border?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
}

export const Surface: React.FC<SurfaceProps> = ({
  variant = "pure",
  border = true,
  padding = "md",
  children,
  className = "",
  style,
  ...props
}) => {
  const paddingMap = {
    none: "0px",
    sm: "12px",
    md: "20px",
    lg: "24px",
    xl: "32px",
  };

  const bgMap = {
    pure: "var(--rf-surface)",
    "light-blue": "var(--rf-surface-light-blue)",
    subtle: "var(--rf-surface-subtle)",
    tinted: "var(--rf-surface-blue-tint)",
  };

  return (
    <div
      style={{
        backgroundColor: bgMap[variant],
        border: border ? "1px solid var(--rf-border)" : "none",
        borderRadius: "var(--rf-radius-surface)",
        padding: paddingMap[padding],
        ...style,
      }}
      className={`rf-surface rf-surface-${variant} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/* Analytical Rail - Dedicated contextual or telemetry sidebar / rail */
export interface AnalyticalRailProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export const AnalyticalRail: React.FC<AnalyticalRailProps> = ({
  title,
  badge,
  action,
  children,
  className = "",
  style,
  ...props
}) => {
  return (
    <aside
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
      className={`rf-analytical-rail ${className}`}
      {...props}
    >
      {(title || badge || action) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--rf-border)",
            backgroundColor: "var(--rf-surface-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {title && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 650,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-navy-primary)",
                }}
              >
                {title}
              </span>
            )}
            {badge}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {children}
      </div>
    </aside>
  );
};

/* Section Surface - Full width structured operational section */
export interface SectionSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export const SectionSurface: React.FC<SectionSurfaceProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  className = "",
  style,
  ...props
}) => {
  return (
    <section
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
      className={`rf-section-surface ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "1px solid var(--rf-border)",
            backgroundColor: "var(--rf-surface)",
          }}
        >
          <div>
            {title && (
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: 650,
                  color: "var(--rf-navy-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: "12.5px",
                  color: "var(--rf-text-secondary)",
                  marginTop: "2px",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={{ padding: "20px 22px" }}>{children}</div>
    </section>
  );
};

/* Telemetry Rail - High density live system monitoring container */
export interface TelemetryRailProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<{
    label: string;
    value: string | number;
    subtext?: string;
    status?: "normal" | "emerald" | "cyan" | "warning" | "danger";
    code?: boolean;
  }>;
}

export const TelemetryRail: React.FC<TelemetryRailProps> = ({
  items,
  className = "",
  style,
  ...props
}) => {
  const statusColorMap = {
    normal: "var(--rf-navy-primary)",
    emerald: "var(--rf-emerald-text)",
    cyan: "var(--rf-cyan-text)",
    warning: "var(--rf-warning-text)",
    danger: "var(--rf-danger-text)",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1px",
        backgroundColor: "var(--rf-border)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        overflow: "hidden",
        ...style,
      }}
      className={`rf-telemetry-rail ${className}`}
      {...props}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: "var(--rf-surface)",
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--rf-text-muted)",
            }}
          >
            {item.label}
          </span>
          <div
            style={{
              fontSize: item.code ? "13px" : "18px",
              fontWeight: item.code ? 600 : 700,
              color: statusColorMap[item.status || "normal"],
              letterSpacing: "-0.02em",
            }}
            className={item.code ? "font-mono" : "tabular-nums"}
          >
            {item.value}
          </div>
          {item.subtext && (
            <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)" }}>
              {item.subtext}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
