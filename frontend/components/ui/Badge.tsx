"use client";

import React from "react";

export type StatusVariant =
  | "RECOVERED"
  | "ACTIVE"
  | "QUEUED"
  | "FAILED"
  | "ESCALATED"
  | "MANUAL_REVIEW"
  | "MANUAL REVIEW"
  | "CLOSED"
  | "HALF_OPEN"
  | "HALF OPEN"
  | "OPERATIONAL"
  | "AI_ADVISORY"
  | "AI ADVISORY"
  | "SANDBOX"
  | "DEFAULT";

export interface BadgeProps {
  status: StatusVariant | string;
  label?: string;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

interface StatusTheme {
  bg: string;
  border: string;
  text: string;
  dotColor: string;
}

const statusMap: Record<string, StatusTheme> = {
  RECOVERED: {
    bg: "var(--rf-emerald-surface)",
    border: "var(--rf-emerald-border)",
    text: "var(--rf-emerald-text)",
    dotColor: "var(--rf-emerald)",
  },
  ACTIVE: {
    bg: "var(--rf-cyan-surface)",
    border: "var(--rf-cyan-border)",
    text: "var(--rf-cyan-text)",
    dotColor: "var(--rf-cyan)",
  },
  QUEUED: {
    bg: "var(--rf-blue-queued-surface)",
    border: "var(--rf-blue-queued-border)",
    text: "var(--rf-blue-queued-text)",
    dotColor: "var(--rf-blue-queued)",
  },
  FAILED: {
    bg: "var(--rf-danger-surface)",
    border: "var(--rf-danger-border)",
    text: "var(--rf-danger-text)",
    dotColor: "var(--rf-danger)",
  },
  ESCALATED: {
    bg: "var(--rf-warning-surface)",
    border: "var(--rf-warning-border)",
    text: "var(--rf-warning-text)",
    dotColor: "var(--rf-warning)",
  },
  "MANUAL REVIEW": {
    bg: "var(--rf-warning-surface)",
    border: "var(--rf-warning-border)",
    text: "var(--rf-warning-text)",
    dotColor: "var(--rf-warning)",
  },
  MANUAL_REVIEW: {
    bg: "var(--rf-warning-surface)",
    border: "var(--rf-warning-border)",
    text: "var(--rf-warning-text)",
    dotColor: "var(--rf-warning)",
  },
  CLOSED: {
    bg: "rgba(16, 42, 67, 0.05)",
    border: "var(--rf-border)",
    text: "var(--rf-text-secondary)",
    dotColor: "var(--rf-text-muted)",
  },
  "HALF OPEN": {
    bg: "var(--rf-warning-surface)",
    border: "var(--rf-warning-border)",
    text: "var(--rf-warning-text)",
    dotColor: "var(--rf-warning)",
  },
  HALF_OPEN: {
    bg: "var(--rf-warning-surface)",
    border: "var(--rf-warning-border)",
    text: "var(--rf-warning-text)",
    dotColor: "var(--rf-warning)",
  },
  OPERATIONAL: {
    bg: "var(--rf-emerald-surface)",
    border: "var(--rf-emerald-border)",
    text: "var(--rf-emerald-text)",
    dotColor: "var(--rf-emerald)",
  },
  "AI ADVISORY": {
    bg: "var(--rf-violet-surface)",
    border: "var(--rf-violet-border)",
    text: "var(--rf-violet-text)",
    dotColor: "var(--rf-violet)",
  },
  AI_ADVISORY: {
    bg: "var(--rf-violet-surface)",
    border: "var(--rf-violet-border)",
    text: "var(--rf-violet-text)",
    dotColor: "var(--rf-violet)",
  },
  SANDBOX: {
    bg: "var(--rf-surface-blue-tint)",
    border: "var(--rf-cyan-border)",
    text: "var(--rf-cyan-text)",
    dotColor: "var(--rf-cyan)",
  },
  DEFAULT: {
    bg: "var(--rf-surface-subtle)",
    border: "var(--rf-border)",
    text: "var(--rf-text-secondary)",
    dotColor: "var(--rf-text-muted)",
  },
};

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  dot = true,
  size = "md",
  icon,
  className = "",
}) => {
  const normalizedKey = (status || "DEFAULT").toUpperCase().replace(/-/g, "_");
  const theme = statusMap[normalizedKey] || statusMap[status] || statusMap.DEFAULT;
  const displayLabel = label || status.replace(/_/g, " ");

  const isSmall = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: isSmall ? "2px 6px" : "3px 8px",
        fontSize: isSmall ? "10.5px" : "11.5px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        borderRadius: "var(--rf-radius-badge)",
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        color: theme.text,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
      className={`rf-badge ${className}`}
    >
      {dot && (
        <span
          style={{
            width: isSmall ? "5px" : "6px",
            height: isSmall ? "5px" : "6px",
            borderRadius: "50%",
            backgroundColor: theme.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {icon && <span style={{ display: "inline-flex", fontSize: "12px" }}>{icon}</span>}
      <span>{displayLabel}</span>
    </span>
  );
};
