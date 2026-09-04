"use client";

import React from "react";
import { OperationalSafeguardItem } from "@/lib/types/operations";
import { Badge } from "@/components/ui/Badge";
import { Cpu } from "lucide-react";

export interface SafeguardsSectionProps {
  safeguards: OperationalSafeguardItem[];
}

export const SafeguardsSection: React.FC<SafeguardsSectionProps> = ({ safeguards }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Section Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
            Operational Safeguards & Policy Boundary
          </div>
          <div style={{ fontSize: "12px", color: "var(--rf-text-muted)" }}>
            Read-only automated constraints and architectural execution barriers
          </div>
        </div>

        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: "rgba(16, 42, 67, 0.06)",
            color: "var(--rf-text-muted)",
            letterSpacing: "0.05em",
          }}
        >
          READ ONLY ENFORCEMENT
        </span>
      </div>

      {/* Policy Boundary Banner */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid var(--rf-border)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 1px 2px rgba(16, 42, 67, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              backgroundColor: "rgba(121, 87, 213, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--rf-violet)",
            }}
          >
            <Cpu size={18} />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Architectural Execution Boundary
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>
              Strict governance separation between advisory machine intelligence and transaction execution
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              backgroundColor: "rgba(121, 87, 213, 0.08)",
              border: "1px solid var(--rf-violet-border)",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--rf-violet)",
            }}
          >
            <span>AI ADVISORY:</span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>0% EXECUTION AUTHORITY</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              backgroundColor: "rgba(0, 178, 122, 0.08)",
              border: "1px solid var(--rf-emerald-border)",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--rf-emerald)",
            }}
          >
            <span>POLICY ENGINE:</span>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>100% EXECUTION AUTHORITY</span>
          </div>
        </div>
      </div>

      {/* Safeguards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "12px",
        }}
      >
        {safeguards.map((sg) => (
          <div
            key={sg.id}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
                {sg.name}
              </span>
              <Badge
                status={sg.status === "ACTIVE" ? "OPERATIONAL" : "ACTIVE"}
                label={sg.status}
                size="sm"
              />
            </div>

            <div
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "11px",
                color: "var(--rf-cyan)",
                backgroundColor: "var(--rf-canvas)",
                padding: "6px 8px",
                borderRadius: "4px",
                border: "1px solid var(--rf-border)",
              }}
            >
              {sg.rule}
            </div>

            <div style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)", lineHeight: 1.4 }}>
              {sg.description}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "6px",
                borderTop: "1px solid var(--rf-border)",
                fontSize: "10.5px",
                color: "var(--rf-text-muted)",
              }}
            >
              <span>Enforcement: {sg.enforcement}</span>
              <span>Read-Only Constraint</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
