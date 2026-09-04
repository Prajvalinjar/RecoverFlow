"use client";

import React, { use } from "react";
import Link from "next/link";
import { useCaseDetail } from "@/lib/api/useCaseDetail";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import {
  ArrowLeft,
  RefreshCw,
  CreditCard,
  AlertOctagon,
  Cpu,
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

export default function CaseInvestigationPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const { caseData, isLoading, isRefreshing, isNotFound, refresh } = useCaseDetail(caseId);

  function formatDate(iso?: string) {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  if (isNotFound) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ padding: "40px 20px", textAlign: "center", backgroundColor: "var(--rf-surface)", border: "1px solid var(--rf-border)", borderRadius: "var(--rf-radius-surface)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 750, color: "var(--rf-navy-primary)", marginBottom: "8px" }}>
            Case Not Found
          </h2>
          <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", marginBottom: "20px" }}>
            The requested recovery case &ldquo;{caseId}&rdquo; could not be located in the database repository.
          </p>
          <Link href="/cases" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" icon={<ArrowLeft size={14} />}>
              Back to Recovery Cases
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !caseData) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--rf-text-muted)" }}>
        Loading case investigation telemetry for {caseId}...
      </div>
    );
  }

  const c = caseData!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header & Navigation Backlink */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--rf-border)",
        }}
      >
        {/* Backlink & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/cases"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 650,
              color: "var(--rf-text-secondary)",
              textDecoration: "none",
            }}
            className="hover:text-rf-navy"
          >
            <ArrowLeft size={14} />
            <span>Back to Cases</span>
          </Link>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--rf-text-muted)" }} className="font-mono">
            INVESTIGATION ID: {c.caseId}
          </span>
        </div>

        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "var(--rf-navy-primary)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
                className="font-mono"
              >
                {c.caseId}
              </h1>
              <Badge
                status={
                  c.state === "RECOVERED"
                    ? "RECOVERED"
                    : c.state === "FAILED"
                    ? "FAILED"
                    : c.state === "MANUAL_REVIEW" || c.state === "ESCALATED" || c.state === "STOPPED"
                    ? "MANUAL_REVIEW"
                    : c.state === "QUEUED"
                    ? "QUEUED"
                    : "ACTIVE"
                }
                size="md"
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "var(--rf-radius-badge)",
                  backgroundColor: "var(--rf-surface-subtle)",
                  color: "var(--rf-text-secondary)",
                  border: "1px solid var(--rf-border)",
                }}
                className="font-mono"
              >
                PRIORITY: {c.priority}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--rf-text-secondary)" }}>
              Created on {formatDate(c.createdAt)} • Provider: <strong>{c.provider}</strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                padding: "6px 14px",
                backgroundColor: "var(--rf-surface)",
                border: "1px solid var(--rf-border)",
                borderRadius: "var(--rf-radius-control)",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase" }}>
                RECOVERY AMOUNT
              </span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--rf-navy-primary)" }} className="font-mono tabular-nums">
                {formatMoney(c.amount, c.currency)}
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Refreshing..." : "Refresh Case"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Grid: Payment Details & Failure Diagnostics (50/50 Grid) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-investigation-grid">
        {/* Card 1: Payment & Transaction Details */}
        <div
          style={{
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--rf-border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--rf-surface-subtle)",
            }}
          >
            <CreditCard size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Payment & Transaction Scope
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Payment ID:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {c.paymentId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Customer Reference:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }}>{c.customerId}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Customer Segment:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-cyan-text)" }}>{c.customerSegment}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Gross Amount:</span>
              <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono tabular-nums">
                {formatMoney(c.amount, c.currency)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Payment Gateway:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }}>{c.provider}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Failure & Root Cause Intelligence */}
        <div
          style={{
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--rf-border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--rf-surface-subtle)",
            }}
          >
            <AlertOctagon size={15} color="var(--rf-danger)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Failure Diagnostics & Taxonomy
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Failure Code:</span>
              <code
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  backgroundColor: "var(--rf-danger-surface)",
                  color: "var(--rf-danger-text)",
                  border: "1px solid var(--rf-danger-border)",
                  borderRadius: "4px",
                }}
                className="font-mono"
              >
                {c.failureCode}
              </code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Classification:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }}>Transient Provider Interruption</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Recoverability Yield:</span>
              <span style={{ fontWeight: 700, color: "var(--rf-emerald-text)" }}>92% Autonomous Salvage</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Terminal Status:</span>
              <span style={{ fontWeight: 550, color: c.terminalReason ? "var(--rf-danger)" : "var(--rf-text-muted)" }}>
                {c.terminalReason || "Non-terminal (Eligible for retry)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Grid: Policy Authority Governance & Job Execution (50/50 Grid) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-investigation-grid">
        {/* Card 3: Policy Authority Governance */}
        <div
          style={{
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--rf-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "var(--rf-surface-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={15} color="var(--rf-emerald)" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
                Policy & Governance Evaluation
              </span>
            </div>

            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                backgroundColor: "var(--rf-emerald-surface)",
                color: "var(--rf-emerald-text)",
                border: "1px solid var(--rf-emerald-border)",
                borderRadius: "3px",
              }}
              className="font-mono"
            >
              100% DETERMINISTIC AUTHORITY
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "var(--rf-surface-subtle)",
                border: "1px solid var(--rf-border)",
                borderRadius: "var(--rf-radius-control)",
                fontSize: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--rf-text-muted)" }}>Authority Engine:</span>
                <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }}>{c.policyDecision.authorityType}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--rf-text-muted)" }}>Execution Verdict:</span>
                <span style={{ fontWeight: 700, color: "var(--rf-emerald-text)" }} className="font-mono">
                  {c.policyDecision.decision}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Idempotency Key:</span>
              <code style={{ fontSize: "11px", color: "var(--rf-navy-primary)" }} className="font-mono">
                {c.policyDecision.idempotencyKey}
              </code>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Governing Rules Fired:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
                {c.policyDecision.rulesTriggered.map((rule) => (
                  <span
                    key={rule}
                    style={{
                      fontSize: "10.5px",
                      padding: "2px 6px",
                      backgroundColor: "var(--rf-canvas)",
                      border: "1px solid var(--rf-border)",
                      borderRadius: "3px",
                      color: "var(--rf-text-secondary)",
                    }}
                    className="font-mono"
                  >
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Execution Engine & Attempt History */}
        <div
          style={{
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--rf-border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--rf-surface-subtle)",
            }}
          >
            <Cpu size={15} color="var(--rf-cyan)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Execution Attempts & Jobs ({c.attemptCount}/{c.maxAllowedAttempts})
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {c.attempts.map((att) => (
              <div
                key={att.attemptNumber}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  backgroundColor: "var(--rf-surface-subtle)",
                  border: "1px solid var(--rf-border)",
                  borderRadius: "var(--rf-radius-control)",
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {att.status === "SUCCESS" ? (
                    <CheckCircle2 size={14} color="var(--rf-emerald)" />
                  ) : (
                    <XCircle size={14} color="var(--rf-danger)" />
                  )}
                  <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono">
                    ATTEMPT 0{att.attemptNumber}
                  </span>
                  <span style={{ color: "var(--rf-text-muted)" }}>• {att.provider}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {att.latencyMs && (
                    <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }} className="font-mono">
                      {att.latencyMs}ms
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: att.status === "SUCCESS" ? "var(--rf-emerald-text)" : "var(--rf-danger)",
                    }}
                    className="font-mono"
                  >
                    {att.status}
                  </span>
                </div>
              </div>
            ))}

            {c.jobs.length > 0 && (
              <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase" }}>
                  Distributed Queue Jobs ({c.jobs.length})
                </span>
                {c.jobs.map((job) => (
                  <div
                    key={job.jobId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "11.5px",
                      color: "var(--rf-text-secondary)",
                      padding: "4px 8px",
                      backgroundColor: "var(--rf-canvas)",
                      borderRadius: "3px",
                    }}
                    className="font-mono"
                  >
                    <span>{job.jobId}</span>
                    <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }}>{job.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Chronological Recovery Timeline & Audit Events */}
      <div
        style={{
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--rf-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--rf-surface-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={16} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Chronological Recovery Event Stream
            </span>
          </div>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 650,
              padding: "2px 8px",
              backgroundColor: "var(--rf-surface)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-badge)",
              color: "var(--rf-text-secondary)",
            }}
            className="font-mono"
          >
            {c.timeline.length} AUDIT EVENTS
          </span>
        </div>

        {/* Timeline Events List */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {c.timeline.map((evt, idx) => (
            <div
              key={evt.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                position: "relative",
              }}
            >
              {/* Vertical line connector */}
              {idx < c.timeline.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "22px",
                    left: "11px",
                    bottom: "-16px",
                    width: "2px",
                    backgroundColor: "var(--rf-border)",
                  }}
                />
              )}

              {/* Icon Marker */}
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor:
                    evt.status === "SUCCESS"
                      ? "var(--rf-emerald-surface)"
                      : evt.status === "FAILED"
                      ? "var(--rf-danger-surface)"
                      : "var(--rf-surface-light-blue)",
                  border: `1px solid ${
                    evt.status === "SUCCESS"
                      ? "var(--rf-emerald-border)"
                      : evt.status === "FAILED"
                      ? "var(--rf-danger-border)"
                      : "var(--rf-cyan-border)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 2,
                }}
              >
                {evt.status === "SUCCESS" ? (
                  <CheckCircle2 size={13} color="var(--rf-emerald)" />
                ) : evt.status === "FAILED" ? (
                  <XCircle size={13} color="var(--rf-danger)" />
                ) : (
                  <Clock size={13} color="var(--rf-cyan)" />
                )}
              </div>

              {/* Event Content */}
              <div
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  backgroundColor: "var(--rf-surface-subtle)",
                  border: "1px solid var(--rf-border-subtle)",
                  borderRadius: "var(--rf-radius-control)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
                    {evt.title}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }} className="font-mono">
                    {formatDate(evt.timestamp)}
                  </span>
                </div>

                <p style={{ fontSize: "12px", color: "var(--rf-text-secondary)", margin: 0 }}>
                  {evt.description}
                </p>

                {evt.details && Object.keys(evt.details).length > 0 && (
                  <pre
                    style={{
                      margin: "6px 0 0 0",
                      padding: "6px 8px",
                      backgroundColor: "var(--rf-canvas)",
                      border: "1px solid var(--rf-border)",
                      borderRadius: "3px",
                      fontSize: "10.5px",
                      color: "var(--rf-navy-primary)",
                      overflowX: "auto",
                    }}
                    className="font-mono"
                  >
                    {JSON.stringify(evt.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .rf-investigation-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
