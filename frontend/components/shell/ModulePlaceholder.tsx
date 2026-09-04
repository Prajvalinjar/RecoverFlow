"use client";

import React from "react";
import { Badge } from "../ui/Badge";
import { Clock, ShieldCheck, Terminal } from "lucide-react";

export interface ModulePlaceholderProps {
  title: string;
  section: string;
  route: string;
  description?: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  section,
  route,
  description = "This module is slated for upcoming implementation phases in the RecoverFlow control roadmap.",
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        maxWidth: "1000px",
      }}
    >
      {/* Header Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--rf-cyan)",
            }}
          >
            {section}
          </span>
          <span style={{ color: "var(--rf-border)" }}>•</span>
          <span
            style={{
              fontSize: "12px",
              color: "var(--rf-text-muted)",
            }}
            className="font-mono"
          >
            {route}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 750,
              color: "var(--rf-navy-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          <Badge status="QUEUED" label="Module Pending" size="sm" dot={false} />
        </div>

        <p
          style={{
            fontSize: "13.5px",
            color: "var(--rf-text-secondary)",
            maxWidth: "680px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>

      {/* Structural Card Notice */}
      <div
        style={{
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--rf-navy-primary)",
            fontWeight: 650,
            fontSize: "14px",
          }}
        >
          <Clock size={16} style={{ color: "var(--rf-cyan)" }} />
          <span>Module Implementation Pending</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "var(--rf-canvas)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--rf-text-muted)",
              }}
            >
              Route Destination
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--rf-navy-primary)",
              }}
              className="font-mono"
            >
              {route}
            </span>
          </div>

          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "var(--rf-canvas)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--rf-text-muted)",
              }}
            >
              Application Shell Status
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={14} style={{ color: "var(--rf-emerald)" }} />
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "var(--rf-emerald-text)",
                }}
              >
                Navigation Verified
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "var(--rf-canvas)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--rf-text-muted)",
              }}
            >
              Telemetry & State
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Terminal size={14} style={{ color: "var(--rf-cyan)" }} />
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: 500,
                  color: "var(--rf-text-secondary)",
                }}
              >
                Control Shell Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
