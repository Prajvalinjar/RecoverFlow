"use client";

import React, { use } from "react";
import Link from "next/link";
import { useAuditDetail } from "@/lib/api/useAuditDetail";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  RefreshCw,
  History,
  ShieldCheck,
  Cpu,
  ExternalLink,
  Code,
} from "lucide-react";

export default function AuditEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { eventData, isLoading, isRefreshing, isNotFound, refresh } = useAuditDetail(eventId);

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
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 750, color: "var(--rf-navy-primary)", marginBottom: "8px" }}>
            Audit Event Not Found
          </h2>
          <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", marginBottom: "20px" }}>
            The requested audit event record &ldquo;{eventId}&rdquo; was not found in the audit event ledger.
          </p>
          <Link href="/audit" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" icon={<ArrowLeft size={14} />}>
              Back to Audit Trail
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !eventData) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--rf-text-muted)" }}>
        Loading audit event details for {eventId}...
      </div>
    );
  }

  const e = eventData!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--rf-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/audit"
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
            <span>Back to Audit Trail</span>
          </Link>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--rf-text-muted)" }} className="font-mono">
            AUDIT EVENT: {e.eventId}
          </span>
        </div>

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
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--rf-navy-primary)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
                className="font-mono"
              >
                {e.eventType}
              </h1>
              <Badge
                status={
                  e.status === "SUCCESS"
                    ? "RECOVERED"
                    : e.status === "FAILED"
                    ? "FAILED"
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
                  color: "var(--rf-navy-primary)",
                  border: "1px solid var(--rf-border)",
                }}
                className="font-mono"
              >
                ENTITY: {e.entityType}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--rf-text-secondary)" }}>
              Committed on {formatDate(e.timestamp)} • Actor / Service: <strong>{e.actor}</strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Grid Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-audit-detail-grid">
        {/* Card 1: Event Identity & Correlation */}
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
            <History size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Event Metadata & Scope
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Event Identifier:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {e.eventId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Entity Target:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {e.entityId} ({e.entityType})
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Correlation ID:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-cyan-text)" }} className="font-mono">
                {e.correlationId || "corr_direct_event"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Actor / Source:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }}>{e.actor}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Recorded At:</span>
              <span style={{ fontWeight: 550, color: "var(--rf-text-secondary)" }} className="font-mono">
                {formatDate(e.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Entity Cross-Links */}
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
            <ShieldCheck size={15} color="var(--rf-emerald)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Entity Navigation
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {e.caseId && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                <span style={{ color: "var(--rf-text-muted)" }}>Recovery Case:</span>
                <Link href={`/cases/${encodeURIComponent(e.caseId)}`} style={{ fontWeight: 700, color: "var(--rf-navy-primary)", textDecoration: "none" }} className="font-mono hover:underline">
                  {e.caseId}
                </Link>
              </div>
            )}
            {e.paymentId && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                <span style={{ color: "var(--rf-text-muted)" }}>Payment Intent:</span>
                <Link href={`/payments/${encodeURIComponent(e.paymentId)}`} style={{ fontWeight: 700, color: "var(--rf-text-secondary)", textDecoration: "none" }} className="font-mono hover:underline">
                  {e.paymentId}
                </Link>
              </div>
            )}
            {e.jobId && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                <span style={{ color: "var(--rf-text-muted)" }}>Queue Job:</span>
                <Link href={`/jobs/${encodeURIComponent(e.jobId)}`} style={{ fontWeight: 700, color: "var(--rf-navy-primary)", textDecoration: "none" }} className="font-mono hover:underline">
                  {e.jobId}
                </Link>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              {e.caseId ? (
                <Link href={`/cases/${encodeURIComponent(e.caseId)}`} style={{ textDecoration: "none", flex: 1 }}>
                  <Button variant="secondary" size="sm" style={{ width: "100%" }} icon={<ExternalLink size={12} />}>
                    Inspect Case
                  </Button>
                </Link>
              ) : null}
              <Link href="/recovery-flow" style={{ textDecoration: "none", flex: 1 }}>
                <Button variant="ghost" size="sm" style={{ width: "100%" }} icon={<Cpu size={12} />}>
                  Recovery Flow
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Structured Event Payload (Sanitized) */}
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
            backgroundColor: "var(--rf-surface-subtle)",
            borderBottom: "1px solid var(--rf-border)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Code size={15} color="var(--rf-navy-primary)" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
            Structured Event Payload (Sanitized JSON)
          </span>
        </div>

        <div style={{ padding: "18px" }}>
          <pre
            style={{
              padding: "14px",
              backgroundColor: "var(--rf-canvas)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
              fontSize: "12px",
              color: "var(--rf-navy-primary)",
              overflowX: "auto",
              lineHeight: 1.5,
            }}
            className="font-mono"
          >
            {JSON.stringify(e.payload, null, 2)}
          </pre>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .rf-audit-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
