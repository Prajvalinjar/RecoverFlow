"use client";

import React, { use } from "react";
import Link from "next/link";
import { useWorkerDetail } from "@/lib/api/useWorkerDetail";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, RefreshCw, Cpu, Server, ExternalLink } from "lucide-react";

export default function WorkerDetailPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  const { workerId } = use(params);
  const { workerData, isLoading, isRefreshing, isNotFound, refresh } = useWorkerDetail(workerId);

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
            Worker Node Not Found
          </h2>
          <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", marginBottom: "20px" }}>
            The requested execution worker &ldquo;{workerId}&rdquo; was not found in the registry.
          </p>
          <Link href="/workers" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" icon={<ArrowLeft size={14} />}>
              Back to Workers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !workerData) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--rf-text-muted)" }}>
        Loading worker node details for {workerId}...
      </div>
    );
  }

  const w = workerData!;

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
            href="/workers"
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
            <span>Back to Workers</span>
          </Link>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--rf-text-muted)" }} className="font-mono">
            WORKER NODE: {w.workerId}
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
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "var(--rf-navy-primary)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
                className="font-mono"
              >
                {w.workerId}
              </h1>
              <Badge status={w.status === "RUNNING" || w.status === "IDLE" ? "RECOVERED" : "FAILED"} size="md" />
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
                PID: {w.processId}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--rf-text-secondary)" }}>
              Hostname: <strong className="font-mono">{w.hostname}</strong> • Version: {w.version}
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
                IN-FLIGHT LEASE
              </span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--rf-navy-primary)" }} className="font-mono">
                {w.activeJobsCount} Active Job
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

      {/* 2. Grid Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-worker-detail-grid">
        {/* Card 1: Worker Telemetry & Lease */}
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
            <Server size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Worker Node Telemetry
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Worker Identifier:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {w.workerId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Hostname:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }} className="font-mono">
                {w.hostname}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Process ID (PID):</span>
              <span style={{ fontWeight: 600, color: "var(--rf-cyan-text)" }} className="font-mono">
                {w.processId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Assigned Queue:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }} className="font-mono">
                {w.assignedQueue}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Last Heartbeat:</span>
              <span style={{ fontWeight: 550, color: "var(--rf-emerald-text)" }} className="font-mono">
                {formatDate(w.lastHeartbeatAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Worker Capabilities & Navigation */}
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
              Execution Capabilities
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {w.capabilities.map((cap) => (
              <div
                key={cap}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  backgroundColor: "var(--rf-surface-subtle)",
                  border: "1px solid var(--rf-border-subtle)",
                  borderRadius: "var(--rf-radius-control)",
                  fontSize: "12px",
                }}
              >
                <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                  {cap}
                </span>
                <span style={{ color: "var(--rf-emerald-text)", fontSize: "11px", fontWeight: 700 }}>REGISTERED</span>
              </div>
            ))}

            <div style={{ marginTop: "12px" }}>
              <Link href="/jobs" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="sm" style={{ width: "100%" }} icon={<ExternalLink size={12} />}>
                  View Queue Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .rf-worker-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
