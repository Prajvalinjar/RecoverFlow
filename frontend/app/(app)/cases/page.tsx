"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useCases } from "@/lib/api/useCases";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import { Search, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export default function RecoveryCasesPage() {
  const { cases, summary, isLoading, isRefreshing, isLive, refresh } = useCases();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [failureFilter, setFailureFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_desc" | "amount_asc" | "attempts">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract distinct failure codes from available cases
  const availableFailureCodes = useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => {
      if (c.failureReason) set.add(c.failureReason);
    });
    return Array.from(set);
  }, [cases]);

  // Client-side filtering & sorting
  const filteredAndSortedCases = useMemo(() => {
    let list = [...cases];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.caseId.toLowerCase().includes(q) ||
          c.paymentId.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q) ||
          (c.customerName && c.customerName.toLowerCase().includes(q)) ||
          c.failureReason.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((c) => {
        const stateUpper = c.state.toUpperCase();
        if (statusFilter === "ACTIVE") return stateUpper === "ACTIVE" || stateUpper === "QUEUED";
        if (statusFilter === "MANUAL_REVIEW") return stateUpper === "MANUAL_REVIEW" || stateUpper === "ESCALATED" || stateUpper === "STOPPED";
        return stateUpper === statusFilter;
      });
    }

    // Failure filter
    if (failureFilter !== "ALL") {
      list = list.filter((c) => c.failureReason === failureFilter);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "amount_desc") {
        return b.amount - a.amount;
      }
      if (sortBy === "amount_asc") {
        return a.amount - b.amount;
      }
      if (sortBy === "attempts") {
        return b.attemptCount - a.attemptCount;
      }
      return 0;
    });

    return list;
  }, [cases, searchQuery, statusFilter, failureFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCases.length / pageSize));
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedCases.slice(start, start + pageSize);
  }, [filteredAndSortedCases, currentPage, pageSize]);

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
          <span style={{ color: "var(--rf-text-secondary)" }}>RECOVERY CASES</span>
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
              Recovery Cases
            </h1>
            <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              Payment recovery cases requiring monitoring, recovery execution, and operational investigation.
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
              {isLive ? "LIVE DATABASE" : "SANDBOX REPOSITORY"}
            </span>

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
          className="rf-cases-summary-rail"
        >
          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              TOTAL CASES
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.totalCases}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-cyan-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ACTIVE IN-FLIGHT
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-cyan-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.activeCases}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-emerald-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              RECOVERED
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-emerald-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.recoveredCases}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-danger)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              TERMINAL FAILED
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-danger)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.failedCases}
            </div>
          </div>

          <div style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-warning)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              MANUAL REVIEW
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-warning)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.manualReviewCases}
            </div>
          </div>
        </div>
      )}

      {/* 3. Search, Filter & Controls Bar */}
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
            placeholder="Search Case, Payment, or Customer ID..."
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
            {(["ALL", "RECOVERED", "ACTIVE", "FAILED", "MANUAL_REVIEW"] as const).map((s) => (
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

          {/* Failure Filter */}
          {availableFailureCodes.length > 0 && (
            <select
              value={failureFilter}
              onChange={(e) => {
                setFailureFilter(e.target.value);
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
              <option value="ALL">All Failures</option>
              {availableFailureCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
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
              <option value="amount_desc">Amount: High-Low</option>
              <option value="amount_asc">Amount: Low-High</option>
              <option value="attempts">Attempts: High</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Cases Table Container */}
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
              minWidth: "920px",
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
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "16%" }}>
                  CASE ID
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "13%" }}>
                  PAYMENT
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "14%" }}>
                  FAILURE
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "15%" }}>
                  CUSTOMER
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "11%" }}>
                  AMOUNT
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "11%" }}>
                  STATUS
                </th>
                <th style={{ padding: "11px 10px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "center", width: "7%" }}>
                  ATTEMPTS
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "13%" }}>
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
                    Loading recovery cases...
                  </td>
                </tr>
              ) : paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    No recovery cases matched the search criteria.
                  </td>
                </tr>
              ) : (
                paginatedCases.map((c, idx) => (
                  <tr
                    key={c.caseId}
                    style={{
                      borderBottom: idx === paginatedCases.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
                      transition: "background-color 100ms ease",
                    }}
                    className="rf-table-row"
                  >
                    {/* Case ID */}
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/cases/${encodeURIComponent(c.caseId)}`}
                        style={{
                          fontWeight: 700,
                          color: "var(--rf-navy-primary)",
                          textDecoration: "none",
                          fontSize: "12.5px",
                        }}
                        className="font-mono hover:underline"
                      >
                        {c.caseId}
                      </Link>
                    </td>

                    {/* Payment ID */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ color: "var(--rf-text-secondary)", fontSize: "12px" }} className="font-mono">
                        {c.paymentId}
                      </span>
                    </td>

                    {/* Failure */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <code
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          backgroundColor: "var(--rf-surface-subtle)",
                          border: "1px solid var(--rf-border)",
                          borderRadius: "3px",
                          color: "var(--rf-text-primary)",
                        }}
                        className="font-mono"
                      >
                        {c.failureReason}
                      </code>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--rf-navy-primary)" }}>
                        {c.customerName || c.customerId}
                      </span>
                    </td>

                    {/* Amount */}
                    <td
                      style={{
                        padding: "11px 12px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "var(--rf-navy-primary)",
                        whiteSpace: "nowrap",
                      }}
                      className="font-mono tabular-nums"
                    >
                      {formatMoney(c.amount, c.currency)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
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
                      {c.attemptCount}/{c.maxAllowedAttempts}
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
                      {formatDate(c.createdAt)}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/cases/${encodeURIComponent(c.caseId)}`} style={{ textDecoration: "none" }}>
                        <Button variant="ghost" size="sm" icon={<ArrowRight size={12} />}>
                          Investigate
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
              {filteredAndSortedCases.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-mono font-semibold text-rf-navy">
              {Math.min(currentPage * pageSize, filteredAndSortedCases.length)}
            </span>{" "}
            of{" "}
            <span className="font-mono font-semibold text-rf-navy">{filteredAndSortedCases.length}</span> cases
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
          .rf-cases-summary-rail {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .rf-cases-summary-rail {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
