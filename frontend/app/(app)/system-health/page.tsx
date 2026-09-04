"use client";

import React from "react";
import Link from "next/link";
import { useSystemHealth } from "@/lib/api/useSystemHealth";
import { Button } from "@/components/ui/Button";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function SystemHealthPage() {
  const { health, isLoading, isRefreshing, isLive, refresh } = useSystemHealth();

  function formatDate(iso?: string) {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  if (isLoading && !health) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--rf-text-muted)" }}>
        Loading system health telemetry...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%" }}>
      {/* 1. Page Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--rf-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--rf-text-muted)",
            textTransform: "uppercase",
          }}
        >
          <Link href="/dashboard" style={{ color: "var(--rf-text-muted)", textDecoration: "none" }}>
            RECOVERFLOW
          </Link>
          <span style={{ color: "#CBD5E1" }}>/</span>
          <span style={{ color: "var(--rf-text-secondary)" }}>OPERATIONS</span>
          <span style={{ color: "#CBD5E1" }}>/</span>
          <span style={{ color: "var(--rf-text-secondary)" }}>SYSTEM HEALTH</span>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1
                style={{
                  fontSize: "30px",
                  fontWeight: 750,
                  color: "var(--rf-navy-primary)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
              >
                System Health
              </h1>
              {health && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 750,
                    padding: "3px 10px",
                    borderRadius: "var(--rf-radius-badge)",
                    backgroundColor:
                      health.overallStatus === "OPERATIONAL"
                        ? "var(--rf-emerald-surface)"
                        : "var(--rf-warning-surface)",
                    color:
                      health.overallStatus === "OPERATIONAL"
                        ? "var(--rf-emerald-text)"
                        : "var(--rf-warning-text)",
                    border: `1px solid ${
                      health.overallStatus === "OPERATIONAL"
                        ? "var(--rf-emerald-border)"
                        : "var(--rf-warning-border)"
                    }`,
                  }}
                  className="font-mono"
                >
                  SYSTEM {health.overallStatus}
                </span>
              )}
            </div>
            <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              Infrastructure health across recovery execution, queue, workers, providers, and ledger.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 650,
                padding: "3px 8px",
                borderRadius: "var(--rf-radius-badge)",
                backgroundColor: isLive ? "var(--rf-emerald-surface)" : "var(--rf-canvas)",
                color: isLive ? "var(--rf-emerald-text)" : "var(--rf-text-muted)",
                border: `1px solid ${isLive ? "var(--rf-emerald-border)" : "var(--rf-border)"}`,
              }}
              className="font-mono"
            >
              {isLive ? "LIVE TELEMETRY" : "SANDBOX BASELINE"}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Checking..." : "Sync Health"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Infrastructure Metrics Strip */}
      {health && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            overflow: "hidden",
          }}
          className="rf-health-summary-rail"
        >
          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-cyan-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              QUEUE DEPTH
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-cyan-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {health.metrics.queueDepth} Enqueued
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              BACKPRESSURE LEVEL
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-emerald-text)", marginTop: "2px" }} className="font-mono">
              {health.metrics.backpressureLevel}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              WORKER FLEET
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px" }} className="font-mono tabular-nums">
              {health.metrics.activeWorkers} / {health.metrics.totalWorkers} Online
            </div>
          </div>

          <div style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-emerald-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              CIRCUIT BREAKER
            </span>
            <div style={{ fontSize: "18px", fontWeight: 750, color: "var(--rf-emerald-text)", marginTop: "4px" }} className="font-mono">
              {health.metrics.circuitState} (Execution Permitted)
            </div>
          </div>
        </div>
      )}

      {/* 3. Component Health Grid */}
      {health && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="rf-health-components-grid">
          {Object.entries(health.components).map(([key, comp]) => {
            const isOk = comp.status === "OPERATIONAL";
            return (
              <div
                key={key}
                style={{
                  backgroundColor: "var(--rf-surface)",
                  border: "1px solid var(--rf-border)",
                  borderRadius: "var(--rf-radius-surface)",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isOk ? (
                      <CheckCircle2 size={16} color="var(--rf-emerald)" />
                    ) : (
                      <AlertTriangle size={16} color="var(--rf-warning)" />
                    )}
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
                      {comp.name}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "var(--rf-radius-badge)",
                      backgroundColor: isOk ? "var(--rf-emerald-surface)" : "var(--rf-warning-surface)",
                      color: isOk ? "var(--rf-emerald-text)" : "var(--rf-warning-text)",
                      border: `1px solid ${isOk ? "var(--rf-emerald-border)" : "var(--rf-warning-border)"}`,
                    }}
                    className="font-mono"
                  >
                    {comp.status}
                  </span>
                </div>

                <p style={{ fontSize: "12.5px", color: "var(--rf-text-secondary)", lineHeight: 1.45 }}>
                  {comp.detail}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--rf-border-subtle)",
                    fontSize: "11px",
                    color: "var(--rf-text-muted)",
                  }}
                >
                  <span className="font-mono">
                    Latency: {comp.latencyMs !== null && comp.latencyMs !== undefined ? `${comp.latencyMs}ms` : "—"}
                  </span>
                  <span className="font-mono">Checked at {formatDate(comp.checkedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 1024px) {
          .rf-health-summary-rail {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .rf-health-components-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .rf-health-summary-rail {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
