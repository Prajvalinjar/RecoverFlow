"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRecoveryFlow } from "@/lib/api/useRecoveryFlow";
import { FlowPipeline } from "@/components/recovery-flow/FlowPipeline";
import { PolicyBoundary } from "@/components/recovery-flow/PolicyBoundary";
import { ExecutionReconciliationPanels } from "@/components/recovery-flow/ExecutionReconciliationPanels";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import { RefreshCw, Search, ChevronDown, Check } from "lucide-react";

export default function RecoveryFlowPage() {
  const {
    cases,
    selectedCaseId,
    setSelectedCaseId,
    selectedCaseItem,
    pipelineSteps,
    aiAdvisory,
    deterministicPolicy,
    reconciliation,
    attempts,
    timeline,
    isLoading,
    isRefreshing,
    isLive,
    refresh,
  } = useRecoveryFlow();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter cases for the dropdown
  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return cases;
    const q = searchQuery.toLowerCase().trim();
    return cases.filter(
      (c) =>
        c.caseId.toLowerCase().includes(q) ||
        c.paymentId.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        (c.customerName && c.customerName.toLowerCase().includes(q)) ||
        c.failureReason.toLowerCase().includes(q)
    );
  }, [cases, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%" }}>
      {/* 1. Page Header & Operational Status */}
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
          <span style={{ color: "var(--rf-text-secondary)" }}>INTELLIGENCE</span>
          <span style={{ color: "#CBD5E1" }}>/</span>
          <span style={{ color: "var(--rf-text-secondary)" }}>RECOVERY FLOW</span>
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
              Recovery Flow
            </h1>
            <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              Payment recovery orchestration and policy execution boundary.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 650,
                padding: "3px 8px",
                borderRadius: "var(--rf-radius-badge)",
                backgroundColor: "var(--rf-emerald-surface)",
                color: "var(--rf-emerald-text)",
                border: "1px solid var(--rf-emerald-border)",
              }}
              className="font-mono"
            >
              SYSTEM OPERATIONAL
            </span>

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

            <span
              style={{
                fontSize: "11px",
                fontWeight: 650,
                padding: "3px 8px",
                borderRadius: "var(--rf-radius-badge)",
                backgroundColor: "var(--rf-surface-light-blue)",
                color: "var(--rf-cyan-text)",
                border: "1px solid var(--rf-cyan-border)",
              }}
              className="font-mono"
            >
              CIRCUIT: CLOSED
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Refreshing..." : "Sync Flow"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Case Selector Strip (Searchable Inspector Bar) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          padding: "14px 18px",
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase" }}>
            INSPECT CASE:
          </span>

          {/* Interactive Custom Case Dropdown */}
          <div style={{ position: "relative", minWidth: "260px" }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                height: "36px",
                padding: "0 12px",
                backgroundColor: "var(--rf-surface-subtle)",
                border: "1px solid var(--rf-border)",
                borderRadius: "var(--rf-radius-control)",
                color: "var(--rf-navy-primary)",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              className="font-mono"
            >
              <span>{selectedCaseId || "Select Case..."}</span>
              <ChevronDown size={14} color="var(--rf-text-muted)" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "42px",
                  left: 0,
                  width: "360px",
                  maxHeight: "280px",
                  backgroundColor: "var(--rf-surface)",
                  border: "1px solid var(--rf-border)",
                  borderRadius: "var(--rf-radius-surface)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Search in Dropdown */}
                <div
                  style={{
                    padding: "8px 10px",
                    borderBottom: "1px solid var(--rf-border)",
                    backgroundColor: "var(--rf-surface-subtle)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Search size={13} color="var(--rf-text-muted)" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Case ID or Customer..."
                    style={{
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                      fontSize: "12px",
                      width: "100%",
                      fontFamily: "inherit",
                    }}
                    autoFocus
                  />
                </div>

                {/* Cases List */}
                <div style={{ overflowY: "auto", flex: 1 }}>
                  {filteredCases.map((c) => (
                    <div
                      key={c.caseId}
                      onClick={() => {
                        setSelectedCaseId(c.caseId);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--rf-border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        backgroundColor:
                          c.caseId === selectedCaseId ? "var(--rf-surface-light-blue)" : "transparent",
                      }}
                      className="rf-dropdown-item"
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono">
                          {c.caseId}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }}>
                          {c.customerName || c.customerId} • {c.failureReason}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono">
                          {formatMoney(c.amount, c.currency)}
                        </span>
                        {c.caseId === selectedCaseId && <Check size={14} color="var(--rf-cyan)" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Case Summary Meta */}
          {selectedCaseItem && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
                Payment: <strong className="font-mono">{selectedCaseItem.paymentId}</strong>
              </span>
              <span style={{ color: "#CBD5E1" }}>•</span>
              <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
                Customer: <strong>{selectedCaseItem.customerName || selectedCaseItem.customerId}</strong>
              </span>
              <span style={{ color: "#CBD5E1" }}>•</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono">
                {formatMoney(selectedCaseItem.amount, selectedCaseItem.currency)}
              </span>
              <Badge
                status={
                  selectedCaseItem.state === "RECOVERED"
                    ? "RECOVERED"
                    : selectedCaseItem.state === "FAILED"
                    ? "FAILED"
                    : selectedCaseItem.state === "MANUAL_REVIEW" || selectedCaseItem.state === "ESCALATED"
                    ? "MANUAL_REVIEW"
                    : "ACTIVE"
                }
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Link to Full Investigation */}
        {selectedCaseId && (
          <Link href={`/cases/${encodeURIComponent(selectedCaseId)}`} style={{ textDecoration: "none" }}>
            <Button variant="ghost" size="sm">
              Open Full Case Investigation →
            </Button>
          </Link>
        )}
      </div>

      {/* 3. The 8-Step Recovery Pipeline Track */}
      <FlowPipeline steps={pipelineSteps} isLoading={isLoading} />

      {/* 4. The Central Policy Boundary (AI Advisory vs 100% Deterministic Authority) */}
      <PolicyBoundary aiData={aiAdvisory} policyData={deterministicPolicy} isLoading={isLoading} />

      {/* 5. Execution Engine, Financial Reconciliation & Chronological Audit Event Stream */}
      <ExecutionReconciliationPanels
        attempts={attempts}
        reconciliation={reconciliation}
        timeline={timeline}
        isLoading={isLoading}
      />

      <style jsx global>{`
        .rf-dropdown-item:hover {
          background-color: var(--rf-surface-subtle) !important;
        }
      `}</style>
    </div>
  );
}
