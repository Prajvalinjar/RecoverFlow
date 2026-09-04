"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useWorkers } from "@/lib/api/useWorkers";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, RefreshCw, ArrowRight } from "lucide-react";

export default function WorkersPage() {
  const { workers, summary, isLoading, isRefreshing, isLive, refresh } = useWorkers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return workers;
    const q = searchQuery.toLowerCase().trim();
    return workers.filter(
      (w) =>
        w.workerId.toLowerCase().includes(q) ||
        w.hostname.toLowerCase().includes(q) ||
        w.status.toLowerCase().includes(q)
    );
  }, [workers, searchQuery]);

  function formatDate(iso?: string) {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
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
          <span style={{ color: "var(--rf-text-secondary)" }}>WORKERS</span>
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
            <h1
              style={{
                fontSize: "30px",
                fontWeight: 750,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Workers
            </h1>
            <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              Distributed recovery execution workers, queue lease consumption, and node heartbeats.
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
              {isLive ? "LIVE WORKER REGISTRY" : "SANDBOX BASELINE"}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Refreshing..." : "Sync Fleet"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Summary Metric Strip */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            overflow: "hidden",
          }}
          className="rf-workers-summary-rail"
        >
          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              TOTAL WORKERS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.totalWorkers}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-emerald-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ONLINE & HEALTHY
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-emerald-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.onlineCount}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-cyan-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ACTIVE IN-FLIGHT JOBS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-cyan-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.activeJobs}
            </div>
          </div>

          <div style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              FLEET STATUS
            </span>
            <div style={{ fontSize: "18px", fontWeight: 750, color: "var(--rf-emerald-text)", marginTop: "4px" }} className="font-mono">
              ALL NODES HEALTHY
            </div>
          </div>
        </div>
      )}

      {/* 3. Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 10px",
            height: "36px",
            backgroundColor: "var(--rf-surface-subtle)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-control)",
            minWidth: "240px",
            flex: 1,
            maxWidth: "360px",
          }}
        >
          <Search size={15} color="var(--rf-text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Worker ID or Hostname..."
            style={{
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              fontSize: "13px",
              color: "var(--rf-text-primary)",
              width: "100%",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* 4. Workers Table */}
      <div
        style={{
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "860px",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "var(--rf-surface-subtle)", borderBottom: "1px solid var(--rf-border)" }}>
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "20%" }}>
                  WORKER ID
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "20%" }}>
                  HOSTNAME / PID
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "14%" }}>
                  STATUS
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "14%" }}>
                  QUEUE
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "18%" }}>
                  LAST HEARTBEAT
                </th>
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "14%" }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    Loading worker nodes...
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    No worker nodes found.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w, idx) => (
                  <tr
                    key={w.workerId}
                    style={{
                      borderBottom: idx === filteredWorkers.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
                      transition: "background-color 100ms ease",
                    }}
                    className="rf-table-row"
                  >
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/workers/${encodeURIComponent(w.workerId)}`}
                        style={{ fontWeight: 700, color: "var(--rf-navy-primary)", textDecoration: "none" }}
                        className="font-mono hover:underline"
                      >
                        {w.workerId}
                      </Link>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--rf-text-primary)" }} className="font-mono">
                        {w.hostname} ({w.processId})
                      </span>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <Badge status={w.status === "RUNNING" || w.status === "IDLE" ? "RECOVERED" : "FAILED"} size="sm" />
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)" }} className="font-mono">
                        {w.assignedQueue}
                      </span>
                    </td>

                    <td style={{ padding: "11px 12px", textAlign: "right", whiteSpace: "nowrap" }} className="font-mono">
                      {formatDate(w.lastHeartbeatAt)}
                    </td>

                    <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/workers/${encodeURIComponent(w.workerId)}`} style={{ textDecoration: "none" }}>
                        <Button variant="ghost" size="sm" icon={<ArrowRight size={12} />}>
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .rf-table-row:hover {
          background-color: var(--rf-surface-subtle);
        }
        @media (max-width: 1024px) {
          .rf-workers-summary-rail {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .rf-workers-summary-rail {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
