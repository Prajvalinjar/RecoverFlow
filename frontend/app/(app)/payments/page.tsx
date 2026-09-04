"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePayments } from "@/lib/api/usePayments";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import { Search, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck } from "lucide-react";

export default function PaymentsPage() {
  const { payments, summary, isLoading, isRefreshing, isLive, refresh } = usePayments();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [failureFilter, setFailureFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_desc" | "amount_asc">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract distinct failure codes and providers from loaded payments
  const availableFailureCodes = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => {
      if (p.failureCode) set.add(p.failureCode);
    });
    return Array.from(set);
  }, [payments]);

  const availableProviders = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => {
      if (p.provider) set.add(p.provider);
    });
    return Array.from(set);
  }, [payments]);

  // Client-side filtering & sorting
  const filteredAndSortedPayments = useMemo(() => {
    let list = [...payments];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.paymentId.toLowerCase().includes(q) ||
          p.customerId.toLowerCase().includes(q) ||
          (p.customerName && p.customerName.toLowerCase().includes(q)) ||
          p.provider.toLowerCase().includes(q) ||
          (p.failureCode && p.failureCode.toLowerCase().includes(q)) ||
          (p.caseId && p.caseId.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status.toUpperCase() === statusFilter.toUpperCase());
    }

    // Failure filter
    if (failureFilter !== "ALL") {
      list = list.filter((p) => p.failureCode === failureFilter);
    }

    // Provider filter
    if (providerFilter !== "ALL") {
      list = list.filter((p) => p.provider === providerFilter);
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
      return 0;
    });

    return list;
  }, [payments, searchQuery, statusFilter, failureFilter, providerFilter, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPayments.length / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedPayments.slice(start, start + pageSize);
  }, [filteredAndSortedPayments, currentPage, pageSize]);

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
          <span style={{ color: "var(--rf-text-secondary)" }}>PAYMENTS</span>
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
              Payments
            </h1>
            <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              Payment transaction activity, provider state, failure signals, and recovery linkage.
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
            gridTemplateColumns: "repeat(4, 1fr)",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            overflow: "hidden",
          }}
          className="rf-payments-summary-rail"
        >
          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              TOTAL TRANSACTIONS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.totalPayments}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-danger)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              FAILED TRANSACTIONS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-danger)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.failedPayments}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-emerald-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              RECOVERED BY FLOW
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-emerald-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.recoveredPayments}
            </div>
          </div>

          <div style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-cyan-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ACTIVE IN RECOVERY
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-cyan-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.activeRecoveryPayments}
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
            placeholder="Search Payment ID, Customer, or Code..."
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
            {(["ALL", "FAILED", "SUCCESS", "PENDING"] as const).map((s) => (
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

          {/* Provider Filter */}
          {availableProviders.length > 0 && (
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
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
              <option value="ALL">All Providers</option>
              {availableProviders.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
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
            </select>
          </div>
        </div>
      </div>

      {/* 4. Payments Table Container */}
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
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "16%" }}>
                  PAYMENT ID
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "14%" }}>
                  CUSTOMER
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "13%" }}>
                  PROVIDER
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "11%" }}>
                  AMOUNT
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "10%" }}>
                  STATUS
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "13%" }}>
                  FAILURE CODE
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "13%" }}>
                  RECOVERY LINK
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
                    Loading payment transactions...
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    No payment transactions matched the search criteria.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p, idx) => (
                  <tr
                    key={p.paymentId}
                    style={{
                      borderBottom: idx === paginatedPayments.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
                      transition: "background-color 100ms ease",
                    }}
                    className="rf-table-row"
                  >
                    {/* Payment ID */}
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/payments/${encodeURIComponent(p.paymentId)}`}
                        style={{
                          fontWeight: 700,
                          color: "var(--rf-navy-primary)",
                          textDecoration: "none",
                          fontSize: "12.5px",
                        }}
                        className="font-mono hover:underline"
                      >
                        {p.paymentId}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--rf-navy-primary)" }}>
                        {p.customerName || p.customerId}
                      </span>
                    </td>

                    {/* Provider */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
                        {p.provider}
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
                      {formatMoney(p.amount, p.currency)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <Badge
                        status={
                          p.status === "FAILED"
                            ? "FAILED"
                            : p.status === "SUCCESS" || p.status === "RECOVERED"
                            ? "RECOVERED"
                            : "ACTIVE"
                        }
                        size="sm"
                      />
                    </td>

                    {/* Failure Code */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      {p.failureCode ? (
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
                          {p.failureCode}
                        </code>
                      ) : (
                        <span style={{ color: "var(--rf-text-muted)", fontSize: "11px" }}>None</span>
                      )}
                    </td>

                    {/* Recovery Link */}
                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      {p.caseId ? (
                        <Link
                          href={`/cases/${encodeURIComponent(p.caseId)}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color:
                              p.caseState === "RECOVERED"
                                ? "var(--rf-emerald-text)"
                                : p.caseState === "FAILED"
                                ? "var(--rf-danger)"
                                : "var(--rf-cyan-text)",
                            textDecoration: "none",
                          }}
                          className="font-mono hover:underline"
                        >
                          <ShieldCheck size={12} />
                          <span>{p.caseId}</span>
                        </Link>
                      ) : (
                        <span style={{ color: "var(--rf-text-muted)", fontSize: "11px" }}>No Case</span>
                      )}
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
                      {formatDate(p.createdAt)}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/payments/${encodeURIComponent(p.paymentId)}`} style={{ textDecoration: "none" }}>
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
              {filteredAndSortedPayments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-mono font-semibold text-rf-navy">
              {Math.min(currentPage * pageSize, filteredAndSortedPayments.length)}
            </span>{" "}
            of{" "}
            <span className="font-mono font-semibold text-rf-navy">{filteredAndSortedPayments.length}</span> payments
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
          .rf-payments-summary-rail {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .rf-payments-summary-rail {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
