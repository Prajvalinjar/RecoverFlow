"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useReconciliation } from "@/lib/api/useReconciliation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import { Search, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, CreditCard } from "lucide-react";

export default function ReconciliationPage() {
  const { records, summary, isLoading, isRefreshing, isLive, refresh } = useReconciliation();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_desc" | "amount_asc">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtering & Sorting
  const filteredAndSortedRecords = useMemo(() => {
    let list = [...records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.reconciliationId.toLowerCase().includes(q) ||
          r.caseId.toLowerCase().includes(q) ||
          r.paymentId.toLowerCase().includes(q) ||
          r.provider.toLowerCase().includes(q) ||
          r.ledgerEntryId.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((r) => r.status.toUpperCase() === statusFilter.toUpperCase());
    }

    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.reconciledAt).getTime() - new Date(a.reconciledAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.reconciledAt).getTime() - new Date(b.reconciledAt).getTime();
      }
      if (sortBy === "amount_desc") {
        return b.expectedAmount - a.expectedAmount;
      }
      if (sortBy === "amount_asc") {
        return a.expectedAmount - b.expectedAmount;
      }
      return 0;
    });

    return list;
  }, [records, searchQuery, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRecords.slice(start, start + pageSize);
  }, [filteredAndSortedRecords, currentPage, pageSize]);

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
          <span style={{ color: "var(--rf-text-secondary)" }}>RECONCILIATION</span>
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
              Reconciliation
            </h1>
            <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              Financial integrity verification across payment, recovery execution, and ledger balance.
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
              {isLive ? "LIVE LEDGER" : "SANDBOX LEDGER"}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Refreshing..." : "Sync Ledger"}
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
          className="rf-recon-summary-rail"
        >
          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              TOTAL RECORDS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.totalRecords}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-emerald-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              MATCHED & SETTLED
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-emerald-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.matchedCount}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-cyan-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              PENDING EXECUTION
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-cyan-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.pendingCount}
            </div>
          </div>

          <div style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-danger)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              UNMATCHED / EXCEPTIONS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-danger)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.unmatchedCount + summary.exceptionCount}
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
            placeholder="Search Reconciliation ID, Case, or Payment..."
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
            {(["ALL", "MATCHED", "PENDING", "UNMATCHED", "EXCEPTION"] as const).map((s) => (
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
            </select>
          </div>
        </div>
      </div>

      {/* 4. Reconciliation Table */}
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
                  RECON ID
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "14%" }}>
                  PAYMENT
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "14%" }}>
                  CASE ID
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "12%" }}>
                  EXPECTED
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "12%" }}>
                  RECOVERED
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "12%" }}>
                  STATUS
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "12%" }}>
                  RECONCILED
                </th>
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "8%" }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    Loading financial reconciliation records...
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    No reconciliation records found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => (
                  <tr
                    key={r.reconciliationId}
                    style={{
                      borderBottom: idx === paginatedRecords.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
                      transition: "background-color 100ms ease",
                    }}
                    className="rf-table-row"
                  >
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/reconciliation/${encodeURIComponent(r.reconciliationId)}`}
                        style={{ fontWeight: 700, color: "var(--rf-navy-primary)", textDecoration: "none", fontSize: "12.5px" }}
                        className="font-mono hover:underline"
                      >
                        {r.reconciliationId}
                      </Link>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/payments/${encodeURIComponent(r.paymentId)}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--rf-text-secondary)", textDecoration: "none" }}
                        className="font-mono hover:underline"
                      >
                        <CreditCard size={12} />
                        <span>{r.paymentId}</span>
                      </Link>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/cases/${encodeURIComponent(r.caseId)}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--rf-navy-primary)", textDecoration: "none" }}
                        className="font-mono hover:underline"
                      >
                        <ShieldCheck size={12} color="var(--rf-cyan)" />
                        <span>{r.caseId}</span>
                      </Link>
                    </td>

                    <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: 700, color: "var(--rf-navy-primary)", whiteSpace: "nowrap" }} className="font-mono tabular-nums">
                      {formatMoney(r.expectedAmount, r.currency)}
                    </td>

                    <td
                      style={{
                        padding: "11px 12px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: r.status === "MATCHED" ? "var(--rf-emerald-text)" : "var(--rf-text-muted)",
                        whiteSpace: "nowrap",
                      }}
                      className="font-mono tabular-nums"
                    >
                      {formatMoney(r.actualAmount, r.currency)}
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <Badge
                        status={
                          r.status === "MATCHED"
                            ? "RECOVERED"
                            : r.status === "UNMATCHED" || r.status === "EXCEPTION"
                            ? "FAILED"
                            : "ACTIVE"
                        }
                        size="sm"
                      />
                    </td>

                    <td style={{ padding: "11px 12px", textAlign: "right", color: "var(--rf-text-muted)", fontSize: "11.5px", whiteSpace: "nowrap" }} className="font-mono">
                      {formatDate(r.reconciledAt)}
                    </td>

                    <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/reconciliation/${encodeURIComponent(r.reconciliationId)}`} style={{ textDecoration: "none" }}>
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
              {filteredAndSortedRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-mono font-semibold text-rf-navy">
              {Math.min(currentPage * pageSize, filteredAndSortedRecords.length)}
            </span>{" "}
            of{" "}
            <span className="font-mono font-semibold text-rf-navy">{filteredAndSortedRecords.length}</span> records
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
          .rf-recon-summary-rail {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .rf-recon-summary-rail {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
