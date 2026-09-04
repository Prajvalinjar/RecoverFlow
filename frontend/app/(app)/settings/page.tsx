"use client";

import React from "react";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  Cpu,
  Lock,
  Radio,
  FileCheck,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
            GOVERNANCE & ARCHITECTURE
          </span>
          <span style={{ color: "var(--rf-border)" }}>•</span>
          <span style={{ fontSize: "12px", color: "var(--rf-text-muted)" }} className="font-mono">
            /settings
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 750,
              color: "var(--rf-navy-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            System Configuration & Policy Governance
          </h1>
          <Badge status="ACTIVE" label="SYSTEM OPERATIONAL" size="sm" dot={true} />
        </div>

        <p style={{ fontSize: "13.5px", color: "var(--rf-text-secondary)", maxWidth: "780px", lineHeight: 1.5 }}>
          Codified runtime parameters, deterministic safety ceilings, gateway router bindings, and authority airgap controls governing autonomous recovery operations.
        </p>
      </div>

      {/* Grid: 2 Columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Panel 1: Deterministic Policy Engine Configuration */}
        <Surface variant="pure" padding="lg">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <ShieldCheck size={18} color="var(--rf-emerald)" />
            <span style={{ fontSize: "15px", fontWeight: 750, color: "var(--rf-navy-primary)" }}>
              Deterministic Policy Engine Limits
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Maximum Retry Budget</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>Hard ceiling per payment recovery case</div>
              </div>
              <span className="font-mono" style={{ fontSize: "13px", fontWeight: 750, color: "var(--rf-navy-primary)" }}>3 Attempts</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Minimum Inter-Attempt Cooldown</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>Prevents rapid retry flooding to issuer gateways</div>
              </div>
              <span className="font-mono" style={{ fontSize: "13px", fontWeight: 750, color: "var(--rf-navy-primary)" }}>300s (5 min)</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Monetary Risk Escalation Ceiling</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>Transactions exceeding threshold require escalation</div>
              </div>
              <span className="font-mono" style={{ fontSize: "13px", fontWeight: 750, color: "var(--rf-navy-primary)" }}>₹100,000 / $10,000</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Stopping Rules Engine</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>Automated termination on hard decline or terminal outcome</div>
              </div>
              <Badge status="ACTIVE" label="ENFORCED" size="sm" dot={false} />
            </div>
          </div>
        </Surface>

        {/* Panel 2: AI Architectural Airgap & Authority Separation */}
        <Surface variant="pure" padding="lg">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Lock size={18} color="var(--rf-cyan)" />
            <span style={{ fontSize: "15px", fontWeight: 750, color: "var(--rf-navy-primary)" }}>
              AI Boundary & Authority Specification
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)", borderLeft: "3px solid var(--rf-violet)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>AI Recovery Agent (Prototype V1.0)</span>
                <span className="font-mono" style={{ fontSize: "11px", fontWeight: 750, color: "var(--rf-violet-text)" }}>0% EXECUTION AUTHORITY</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--rf-text-secondary)", lineHeight: 1.45, margin: 0 }}>
                Analyzes failure taxonomy, customer historical reliability, and recovery signals to generate non-binding advisory recommendations. Cannot dispatch payment transactions.
              </p>
            </div>

            <div style={{ padding: "12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)", borderLeft: "3px solid var(--rf-emerald)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>Deterministic Policy Engine</span>
                <span className="font-mono" style={{ fontSize: "11px", fontWeight: 750, color: "var(--rf-emerald-text)" }}>100% EXECUTION AUTHORITY</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--rf-text-secondary)", lineHeight: 1.45, margin: 0 }}>
                Evaluates every recommendation against codified financial constraints, retry ceilings, and operator safelocks. Only policy-approved decisions proceed to execution.
              </p>
            </div>

            <div style={{ padding: "12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)", borderLeft: "3px solid var(--rf-cyan)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>Recovery Orchestrator</span>
                <span className="font-mono" style={{ fontSize: "11px", fontWeight: 750, color: "var(--rf-cyan-text)" }}>CONTROLLED DISPATCH</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--rf-text-secondary)", lineHeight: 1.45, margin: 0 }}>
                Generates deterministic idempotency keys and dispatches approved actions via circuit-breaker protected worker queues.
              </p>
            </div>
          </div>
        </Surface>

        {/* Panel 3: Payment Gateway Routing & Environment */}
        <Surface variant="pure" padding="lg">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Radio size={18} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "15px", fontWeight: 750, color: "var(--rf-navy-primary)" }}>
              Payment Provider Routing Layer
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Primary Gateway</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>Multi-rail webhook ingestion and capture dispatch</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700 }}>Razorpay Gateway</span>
                <Badge status="ACTIVE" label="SANDBOX" size="sm" dot={false} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Simulation Test Bench</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>Deterministic failure simulation harness</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700 }}>Simulated Provider</span>
                <Badge status="ACTIVE" label="ACTIVE" size="sm" dot={false} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Circuit Breaker Health</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>Threshold: 5 consecutive faults • Reset: 30s</div>
              </div>
              <span className="font-mono" style={{ fontSize: "12px", fontWeight: 750, color: "var(--rf-emerald-text)" }}>CLOSED (HEALTHY)</span>
            </div>
          </div>
        </Surface>

        {/* Panel 4: Audit Ledger & Reliability Guarantees */}
        <Surface variant="pure" padding="lg">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <FileCheck size={18} color="var(--rf-emerald)" />
            <span style={{ fontSize: "15px", fontWeight: 750, color: "var(--rf-navy-primary)" }}>
              Auditability & Queue Guarantees
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Idempotency Protection</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>Deterministic keys prevent double execution</div>
              </div>
              <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--rf-emerald-text)" }}>ACTIVE</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Worker Claim Leases</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>PostgreSQL skip-locked claim semantics (60s lease)</div>
              </div>
              <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--rf-cyan-text)" }}>SKIP-LOCKED</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--rf-canvas)", borderRadius: "var(--rf-radius-control)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>Operational Audit Stream</div>
                <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>Every decision, transition, and dispatch recorded</div>
              </div>
              <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--rf-emerald-text)" }}>AUDITED</span>
            </div>
          </div>
        </Surface>
      </div>

      {/* Build Info Bar */}
      <div
        style={{
          padding: "14px 20px",
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-control)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: "var(--rf-text-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Cpu size={14} color="var(--rf-cyan)" />
          <span className="font-mono">RecoverFlow Core v1.0.0-buildathon</span>
          <span style={{ color: "var(--rf-border)" }}>•</span>
          <span>Next.js 16 (Turbopack) &amp; FastAPI (Python 3.12)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="font-mono" style={{ color: "var(--rf-text-muted)" }}>ROLE: OPERATOR (ADMIN)</span>
          <span style={{ color: "var(--rf-border)" }}>•</span>
          <span className="font-mono" style={{ color: "var(--rf-emerald-text)", fontWeight: 700 }}>SAFELOCKS ENGAGED</span>
        </div>
      </div>
    </div>
  );
}
