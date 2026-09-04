"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAudit } from "@/lib/api/useAudit";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export default function AuditPage() {
  const { events, summary, isLoading, isRefreshing, isLive, refresh } = useAudit();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtering & Sorting
  const filteredAndSortedEvents = useMemo(() => {
    let list = [...events];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.eventId.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q) ||
          e.entityId.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q) ||
          (e.correlationId && e.correlationId.toLowerCase().includes(q)) ||
          (e.caseId && e.caseId.toLowerCase().includes(q)) ||
          (e.paymentId && e.paymentId.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((e) => e.status.toUpperCase() === statusFilter.toUpperCase());
    }

    if (entityFilter !== "ALL") {
      list = list.filter((e) => e.entityType.toUpperCase() === entityFilter.toUpperCase());
    }

    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return 0;
    });

    return list;
  }, [events, searchQuery, statusFilter, entityFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedEvents.length / pageSize));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedEvents.slice(start, start + pageSize);
  }, [filteredAndSortedEvents, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-US", {
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
          <span style={{ color: "var(--rf-text-secondary)" }}>AUDIT TRAIL</span>
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
              Audit Trail
            </h1>
            <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              Chronological event ledger across payment failures, deterministic policy evaluations, and executions.
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
              {isLive ? "LIVE AUDIT LEDGER" : "SANDBOX BASELINE"}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Refreshing..." : "Sync Events"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Summary Metric Strip */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            overflow: "hidden",
          }}
          className="rf-audit-summary-rail"
        >
          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              TOTAL AUDIT EVENTS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.totalEvents}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-emerald-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              RECOVERY EVENTS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-emerald-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.recoveryEvents}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-ai-violet)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              POLICY EVENTS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-ai-violet)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.policyEvents}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-cyan-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              EXECUTION EVENTS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-cyan-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.executionEvents}
            </div>
          </div>

          <div style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-danger)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ERROR EVENTS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-danger)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.errorEvents}
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Filters Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search Event, Case, Payment, or Actor..."
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

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--rf-canvas)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
              padding: "2px",
            }}
          >
            {(["ALL", "SUCCESS", "FAILED", "INFO"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: statusFilter === s ? 650 : 500,
                  backgroundColor: statusFilter === s ? "var(--rf-surface)" : "transparent",
                  color: statusFilter === s ? "var(--rf-navy-primary)" : "var(--rf-text-muted)",
                  border: statusFilter === s ? "1px solid var(--rf-border)" : "1px solid transparent",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              height: "36px",
              padding: "0 10px",
              fontSize: "12px",
              backgroundColor: "var(--rf-surface)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
              color: "var(--rf-navy-primary)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Entities</option>
            <option value="RECOVERY">Recovery</option>
            <option value="POLICY">Policy</option>
            <option value="EXECUTION">Execution</option>
            <option value="PAYMENT">Payment</option>
          </select>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              height: "36px",
              padding: "0 10px",
              backgroundColor: "var(--rf-surface)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
            }}
          >
            <ArrowUpDown size={13} color="var(--rf-text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                fontSize: "12px",
                color: "var(--rf-navy-primary)",
                cursor: "pointer",
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Audit Table */}
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
              minWidth: "960px",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "var(--rf-surface-subtle)", borderBottom: "1px solid var(--rf-border)" }}>
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "16%" }}>
                  TIMESTAMP
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "20%" }}>
                  EVENT TYPE
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "10%" }}>
                  ENTITY
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "16%" }}>
                  ENTITY ID
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "16%" }}>
                  ACTOR / SERVICE
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "10%" }}>
                  STATUS
                </th>
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "12%" }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    Loading audit events...
                  </td>
                </tr>
              ) : paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    No audit events found.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((e, idx) => (
                  <tr
                    key={e.eventId}
                    style={{
                      borderBottom: idx === paginatedEvents.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
                      transition: "background-color 100ms ease",
                    }}
                    className="rf-table-row"
                  >
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap", fontSize: "12px", color: "var(--rf-text-secondary)" }} className="font-mono">
                      {formatDate(e.timestamp)}
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <code
                        style={{
                          fontSize: "11.5px",
                          padding: "2px 6px",
                          backgroundColor: "var(--rf-surface-subtle)",
                          border: "1px solid var(--rf-border)",
                          borderRadius: "3px",
                          color: "var(--rf-navy-primary)",
                          fontWeight: 650,
                        }}
                        className="font-mono"
                      >
                        {e.eventType}
                      </code>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--rf-text-muted)" }} className="font-mono">
                        {e.entityType}
                      </span>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      {e.caseId ? (
                        <Link href={`/cases/${encodeURIComponent(e.caseId)}`} style={{ fontWeight: 650, color: "var(--rf-navy-primary)", textDecoration: "none", fontSize: "12px" }} className="font-mono hover:underline">
                          {e.entityId}
                        </Link>
                      ) : e.paymentId ? (
                        <Link href={`/payments/${encodeURIComponent(e.paymentId)}`} style={{ fontWeight: 650, color: "var(--rf-text-secondary)", textDecoration: "none", fontSize: "12px" }} className="font-mono hover:underline">
                          {e.entityId}
                        </Link>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--rf-navy-primary)" }} className="font-mono">
                          {e.entityId}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
                        {e.actor}
                      </span>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <Badge
                        status={
                          e.status === "SUCCESS"
                            ? "RECOVERED"
                            : e.status === "FAILED"
                            ? "FAILED"
                            : "ACTIVE"
                        }
                        size="sm"
                      />
                    </td>

                    <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/audit/${encodeURIComponent(e.eventId)}`} style={{ textDecoration: "none" }}>
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

        {/* Pagination bar */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid var(--rf-border)",
            backgroundColor: "var(--rf-surface-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--rf-text-secondary)",
          }}
        >
          <div>
            Showing{" "}
            <span className="font-mono font-semibold text-rf-navy">
              {filteredAndSortedEvents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-mono font-semibold text-rf-navy">
              {Math.min(currentPage * pageSize, filteredAndSortedEvents.length)}
            </span>{" "}
            of{" "}
            <span className="font-mono font-semibold text-rf-navy">{filteredAndSortedEvents.length}</span> events
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              icon={<ChevronLeft size={13} />}
            >
              Previous
            </Button>
            <span style={{ padding: "0 8px", fontSize: "11.5px" }} className="font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              icon={<ChevronRight size={13} />}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .rf-table-row:hover {
          background-color: var(--rf-surface-subtle);
        }
        @media (max-width: 1024px) {
          .rf-audit-summary-rail {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .rf-audit-summary-rail {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
