"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sliders, GitBranch } from "lucide-react";

export const AnalyticsOperationalLink: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: "var(--rf-navy-primary)",
        color: "#FFFFFF",
        borderRadius: "var(--rf-radius-surface)",
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "20px",
        border: "1px solid var(--rf-navy-border)",
      }}
    >
      <div style={{ maxWidth: "600px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--rf-cyan)",
            letterSpacing: "0.08em",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          OPERATIONAL CONTINUUM
        </span>

        <h3
          style={{
            fontSize: "17px",
            fontWeight: 750,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
            marginTop: "4px",
          }}
        >
          Analytics explains what happened. Operations controls what happens next.
        </h3>

        <p
          style={{
            fontSize: "13px",
            color: "var(--rf-text-inverse-muted)",
            marginTop: "6px",
            lineHeight: 1.5,
          }}
        >
          Transition from retrospective failure metrics into real-time operational execution: pause/resume recovery engine, reconcile queues, and inspect live provider circuits.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <Link
          href="/operations"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "var(--rf-radius-control)",
            backgroundColor: "var(--rf-emerald)",
            color: "#061A2B",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 700,
            transition: "all 120ms ease",
          }}
        >
          <Sliders size={14} />
          <span>Open Operations Control</span>
          <ArrowRight size={14} />
        </Link>

        <Link
          href="/recovery-flow"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "var(--rf-radius-control)",
            backgroundColor: "transparent",
            color: "#FFFFFF",
            border: "1px solid rgba(255,255,255,0.2)",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 120ms ease",
          }}
        >
          <GitBranch size={14} />
          <span>View Recovery Flow</span>
        </Link>
      </div>
    </div>
  );
};
