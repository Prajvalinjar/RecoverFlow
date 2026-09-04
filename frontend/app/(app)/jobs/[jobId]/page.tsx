"use client";

import React, { use } from "react";
import Link from "next/link";
import { useJobDetail } from "@/lib/api/useJobDetail";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  RefreshCw,
  Cpu,
  Layers,
  ShieldCheck,
  CreditCard,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const { jobData, isLoading, isRefreshing, isNotFound, refresh } = useJobDetail(jobId);

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
            Job Not Found
          </h2>
          <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", marginBottom: "20px" }}>
            The requested recovery queue job &ldquo;{jobId}&rdquo; could not be located in the queue store.
          </p>
          <Link href="/jobs" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" icon={<ArrowLeft size={14} />}>
              Back to Jobs & Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !jobData) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--rf-text-muted)" }}>
        Loading queue job details for {jobId}...
      </div>
    );
  }

  const j = jobData!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%" }}>
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
            href="/jobs"
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
            <span>Back to Jobs</span>
          </Link>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--rf-text-muted)" }} className="font-mono">
            QUEUE JOB: {j.jobId}
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
                {j.jobId}
              </h1>
              <Badge
                status={
                  j.status === "SUCCEEDED"
                    ? "RECOVERED"
                    : j.status === "FAILED" || j.status === "DEAD_LETTER"
                    ? "FAILED"
                    : j.status === "CLAIMED"
                    ? "ACTIVE"
                    : "QUEUED"
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
                TYPE: {j.jobType}
              </span>
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
                PRIORITY: {j.priority}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--rf-text-secondary)" }}>
              Created on {formatDate(j.createdAt)} • Provider: <strong>{j.provider}</strong>
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
                EXECUTION ATTEMPTS
              </span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--rf-navy-primary)" }} className="font-mono tabular-nums">
                {j.attemptNumber} / {j.maxAttempts}
              </span>
            </div>

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

      {/* 2. Top Grid: Job Execution Scope & Worker Handoff (50/50 Grid) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-job-detail-grid">
        {/* Card 1: Job Execution Scope */}
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
            <Layers size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Job Execution Scope & Identity
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Job Identifier:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {j.jobId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Job Type:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }}>{j.jobType}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Priority Level:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-cyan-text)" }}>{j.priority}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Correlation ID:</span>
              <code style={{ fontSize: "11px", color: "var(--rf-navy-primary)" }} className="font-mono">
                {j.correlationId || "corr_direct_exec"}
              </code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Lease Expires:</span>
              <span style={{ fontWeight: 550, color: "var(--rf-text-secondary)" }} className="font-mono">
                {j.leaseExpiresAt ? formatDate(j.leaseExpiresAt) : "No active lease"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Worker & Provider Handoff */}
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
              Worker & Provider Handoff
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Claimed Worker Node:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {j.workerId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Worker Hostname:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-text-secondary)" }} className="font-mono">
                {j.workerHostname || "engine-worker-pod-01"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Acquiring Gateway:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }}>{j.provider}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Claim Lock Protocol:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-emerald-text)" }}>PostgreSQL FOR UPDATE SKIP LOCKED</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Grid: Linked Recovery Case & Payment (50/50 Grid) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-job-detail-grid">
        {/* Card 3: Related Recovery Case */}
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
                Linked Recovery Case
              </span>
            </div>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Case Identifier:</span>
              <Link
                href={`/cases/${encodeURIComponent(j.caseId)}`}
                style={{
                  fontWeight: 700,
                  color: "var(--rf-navy-primary)",
                  textDecoration: "none",
                }}
                className="font-mono hover:underline"
              >
                {j.caseId}
              </Link>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <Link href={`/cases/${encodeURIComponent(j.caseId)}`} style={{ textDecoration: "none", flex: 1 }}>
                <Button variant="secondary" size="sm" style={{ width: "100%" }} icon={<ExternalLink size={12} />}>
                  Inspect Recovery Case
                </Button>
              </Link>
              <Link href="/recovery-flow" style={{ textDecoration: "none", flex: 1 }}>
                <Button variant="ghost" size="sm" style={{ width: "100%" }} icon={<Cpu size={12} />}>
                  Recovery Flow
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Card 4: Related Payment Transaction */}
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
              Related Payment Transaction
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Payment Identifier:</span>
              <Link
                href={`/payments/${encodeURIComponent(j.paymentId)}`}
                style={{
                  fontWeight: 700,
                  color: "var(--rf-navy-primary)",
                  textDecoration: "none",
                }}
                className="font-mono hover:underline"
              >
                {j.paymentId}
              </Link>
            </div>

            <div style={{ marginTop: "6px" }}>
              <Link href={`/payments/${encodeURIComponent(j.paymentId)}`} style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="sm" style={{ width: "100%" }} icon={<ExternalLink size={12} />}>
                  Inspect Payment Transaction
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Chronological Job Lifecycle Event Stream */}
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
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Chronological Job Lifecycle Timeline
            </span>
          </div>

          <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }} className="font-mono">
            {j.timeline.length} LIFECYCLE EVENTS
          </span>
        </div>

        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {j.timeline.map((evt, idx) => (
            <div
              key={evt.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: "var(--rf-surface-subtle)",
                border: "1px solid var(--rf-border-subtle)",
                borderRadius: "var(--rf-radius-control)",
                fontSize: "12px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--rf-text-muted)", width: "20px" }} className="font-mono">
                  0{idx + 1}
                </span>
                {evt.status === "SUCCESS" ? (
                  <CheckCircle2 size={13} color="var(--rf-emerald)" />
                ) : evt.status === "FAILED" ? (
                  <XCircle size={13} color="var(--rf-danger)" />
                ) : (
                  <Clock size={13} color="var(--rf-cyan)" />
                )}
                <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }}>{evt.title}</span>
              </div>

              <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)", flex: 1, minWidth: "180px" }}>
                {evt.description}
              </span>

              <span style={{ fontSize: "11px", color: "var(--rf-text-muted)", whiteSpace: "nowrap" }} className="font-mono">
                {formatDate(evt.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .rf-job-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
