"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useJobs } from "@/lib/api/useJobs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, CreditCard } from "lucide-react";

export default function JobsQueuePage() {
  const { jobs, queueStatus, workers, isLoading, isRefreshing, isLive, refresh } = useJobs();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [workerFilter, setWorkerFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "attempts">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract distinct job types and workers
  const availableJobTypes = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.jobType) set.add(j.jobType);
    });
    return Array.from(set);
  }, [jobs]);

  const availableWorkers = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.workerId) set.add(j.workerId);
    });
    workers.forEach((w) => {
      if (w.workerId) set.add(w.workerId);
    });
    return Array.from(set);
  }, [jobs, workers]);

  // Client-side filtering & sorting
  const filteredAndSortedJobs = useMemo(() => {
    let list = [...jobs];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (j) =>
          j.jobId.toLowerCase().includes(q) ||
          j.caseId.toLowerCase().includes(q) ||
          j.paymentId.toLowerCase().includes(q) ||
          (j.workerId && j.workerId.toLowerCase().includes(q)) ||
          j.jobType.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((j) => j.status.toUpperCase() === statusFilter.toUpperCase());
    }

    // Type filter
    if (typeFilter !== "ALL") {
      list = list.filter((j) => j.jobType === typeFilter);
    }

    // Worker filter
    if (workerFilter !== "ALL") {
      list = list.filter((j) => j.workerId === workerFilter);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "attempts") {
        return b.attemptNumber - a.attemptNumber;
      }
      return 0;
    });

    return list;
  }, [jobs, searchQuery, statusFilter, typeFilter, workerFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedJobs.slice(start, start + pageSize);
  }, [filteredAndSortedJobs, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
        {/* Breadcrumb line */}
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
          <span style={{ color: "var(--rf-text-secondary)" }}>RECOVERY</span>
          <span style={{ color: "#CBD5E1" }}>/</span>
          <span style={{ color: "var(--rf-text-secondary)" }}>JOBS & QUEUE</span>
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
              Jobs & Queue
            </h1>
            <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              Queue orchestration, recovery execution scheduling, worker assignment, and job state.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
              {isLive ? "LIVE ORCHESTRATION" : "SANDBOX BASELINE"}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Refreshing..." : "Sync Queue"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Queue Health Strip */}
      {queueStatus && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            overflow: "hidden",
          }}
          className="rf-queue-summary-rail"
        >
          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-cyan-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              QUEUED PENDING
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-cyan-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {queueStatus.queued}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-warning)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              CLAIMED IN-FLIGHT
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-warning)", marginTop: "2px" }} className="font-mono tabular-nums">
              {queueStatus.claimed}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-emerald-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              SUCCEEDED
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-emerald-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {queueStatus.succeeded}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-danger)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              FAILED ATTEMPTS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-danger)", marginTop: "2px" }} className="font-mono tabular-nums">
              {queueStatus.failed}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              DEAD LETTER
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-text-secondary)", marginTop: "2px" }} className="font-mono tabular-nums">
              {queueStatus.deadLetter}
            </div>
          </div>

          <div style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              BACKPRESSURE
            </span>
            <div style={{ fontSize: "18px", fontWeight: 750, color: "var(--rf-emerald-text)", marginTop: "4px" }} className="font-mono">
              {queueStatus.backpressureLevel}
            </div>
          </div>
        </div>
      )}

      {/* 3. Compact Queue Lifecycle Flow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          gap: "12px",
          overflowX: "auto",
        }}
        className="rf-queue-flow-strip"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "180px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--rf-cyan)" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>1. QUEUED PENDING</span>
            <span style={{ fontSize: "10px", color: "var(--rf-text-muted)" }} className="font-mono">
              {queueStatus?.queued || 0} jobs in backlog
            </span>
          </div>
        </div>
        <span style={{ color: "var(--rf-border)" }}>→</span>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "180px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--rf-warning)" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>2. WORKER CLAIMED</span>
            <span style={{ fontSize: "10px", color: "var(--rf-text-muted)" }} className="font-mono">
              {queueStatus?.claimed || 0} leased to workers
            </span>
          </div>
        </div>
        <span style={{ color: "var(--rf-border)" }}>→</span>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "180px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--rf-cyan)" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>3. EXECUTING RETRY</span>
            <span style={{ fontSize: "10px", color: "var(--rf-text-muted)" }} className="font-mono">
              Idempotent gateway call
            </span>
          </div>
        </div>
        <span style={{ color: "var(--rf-border)" }}>→</span>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "180px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--rf-emerald)" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>4. TERMINAL RESULT</span>
            <span style={{ fontSize: "10px", color: "var(--rf-text-muted)" }} className="font-mono">
              {queueStatus?.succeeded || 0} Succeeded / {queueStatus?.failed || 0} Failed
            </span>
          </div>
        </div>
      </div>

      {/* 4. Search, Filter & Controls Bar */}
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
        {/* Search Input */}
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
            placeholder="Search Job ID, Case ID, or Worker..."
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

        {/* Filters Group */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Status Quick Filter */}
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
            {(["ALL", "QUEUED", "CLAIMED", "SUCCEEDED", "FAILED", "DEAD_LETTER"] as const).map((s) => (
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
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Job Type Filter */}
          {availableJobTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
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
              <option value="ALL">All Job Types</option>
              {availableJobTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Worker Filter */}
          {availableWorkers.length > 0 && (
            <select
              value={workerFilter}
              onChange={(e) => {
                setWorkerFilter(e.target.value);
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
              <option value="ALL">All Workers</option>
              {availableWorkers.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          )}

          {/* Sort Dropdown */}
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
              <option value="attempts">Attempts: High</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Jobs Table Container */}
      <div
        style={{
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "100%",
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
              <tr
                style={{
                  backgroundColor: "var(--rf-surface-subtle)",
                  borderBottom: "1px solid var(--rf-border)",
                }}
              >
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "15%" }}>
                  JOB ID
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "13%" }}>
                  TYPE
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "14%" }}>
                  CASE ID
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "13%" }}>
                  PAYMENT
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "11%" }}>
                  STATUS
                </th>
                <th style={{ padding: "11px 10px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "center", width: "8%" }}>
                  ATTEMPTS
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "13%" }}>
                  WORKER
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "11%" }}>
                  CREATED
                </th>
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "8%" }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    Loading recovery queue jobs...
                  </td>
                </tr>
              ) : paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    No queue jobs matched the search criteria.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((j, idx) => (
                  <tr
                    key={j.jobId}
                    style={{
                      borderBottom: idx === paginatedJobs.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
                      transition: "background-color 100ms ease",
                    }}
                    className="rf-table-row"
                  >
                    {/* Job ID */}
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/jobs/${encodeURIComponent(j.jobId)}`}
                        style={{
                          fontWeight: 700,
                          color: "var(--rf-navy-primary)",
                          textDecoration: "none",
                          fontSize: "12.5px",
                        }}
                        className="font-mono hover:underline"
                      >
                        {j.jobId}
                      </Link>
                    </td>

                    {/* Job Type */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "3px",
                          backgroundColor: "var(--rf-surface-subtle)",
                          border: "1px solid var(--rf-border)",
                          color: "var(--rf-navy-primary)",
                        }}
                        className="font-mono"
                      >
                        {j.jobType}
                      </span>
                    </td>

                    {/* Case ID */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/cases/${encodeURIComponent(j.caseId)}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          color: "var(--rf-navy-primary)",
                          textDecoration: "none",
                        }}
                        className="font-mono hover:underline"
                      >
                        <ShieldCheck size={12} color="var(--rf-cyan)" />
                        <span>{j.caseId}</span>
                      </Link>
                    </td>

                    {/* Payment ID */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/payments/${encodeURIComponent(j.paymentId)}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          color: "var(--rf-text-secondary)",
                          textDecoration: "none",
                        }}
                        className="font-mono hover:underline"
                      >
                        <CreditCard size={12} />
                        <span>{j.paymentId}</span>
                      </Link>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
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
                        size="sm"
                      />
                    </td>

                    {/* Attempts */}
                    <td
                      style={{
                        padding: "11px 10px",
                        textAlign: "center",
                        color: "var(--rf-text-secondary)",
                        fontSize: "12px",
                      }}
                      className="font-mono tabular-nums"
                    >
                      {j.attemptNumber}/{j.maxAttempts}
                    </td>

                    {/* Worker */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)" }} className="font-mono">
                        {j.workerId || "unassigned"}
                      </span>
                    </td>

                    {/* Created */}
                    <td
                      style={{
                        padding: "11px 12px",
                        textAlign: "right",
                        color: "var(--rf-text-muted)",
                        fontSize: "11.5px",
                        whiteSpace: "nowrap",
                      }}
                      className="font-mono"
                    >
                      {formatDate(j.createdAt)}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/jobs/${encodeURIComponent(j.jobId)}`} style={{ textDecoration: "none" }}>
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
              {filteredAndSortedJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-mono font-semibold text-rf-navy">
              {Math.min(currentPage * pageSize, filteredAndSortedJobs.length)}
            </span>{" "}
            of{" "}
            <span className="font-mono font-semibold text-rf-navy">{filteredAndSortedJobs.length}</span> jobs
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
          .rf-queue-summary-rail {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .rf-queue-summary-rail {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
