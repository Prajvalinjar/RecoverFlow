"use client";

import React, { use } from "react";
import Link from "next/link";
import { useReconciliationDetail } from "@/lib/api/useReconciliationDetail";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import {
  ArrowLeft,
  RefreshCw,
  Scale,
  ShieldCheck,
  Cpu,
  ExternalLink,
} from "lucide-react";

export default function ReconciliationDetailPage({
  params,
}: {
  params: Promise<{ reconciliationId: string }>;
}) {
  const { reconciliationId } = use(params);
  const { recordData, isLoading, isRefreshing, isNotFound, refresh } = useReconciliationDetail(reconciliationId);

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
            Reconciliation Record Not Found
          </h2>
          <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", marginBottom: "20px" }}>
            The requested financial reconciliation record &ldquo;{reconciliationId}&rdquo; was not found in the ledger.
          </p>
          <Link href="/reconciliation" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" icon={<ArrowLeft size={14} />}>
              Back to Reconciliation
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !recordData) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--rf-text-muted)" }}>
        Loading financial reconciliation details for {reconciliationId}...
      </div>
    );
  }

  const r = recordData!;

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
            href="/reconciliation"
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
            <span>Back to Reconciliation</span>
          </Link>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--rf-text-muted)" }} className="font-mono">
            RECONCILIATION RECORD: {r.reconciliationId}
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
                {r.reconciliationId}
              </h1>
              <Badge
                status={
                  r.status === "MATCHED"
                    ? "RECOVERED"
                    : r.status === "UNMATCHED" || r.status === "EXCEPTION"
                    ? "FAILED"
                    : "ACTIVE"
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
                STATUS: {r.status}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--rf-text-secondary)" }}>
              Settled on {formatDate(r.reconciledAt)} • Ledger Entry: <strong className="font-mono">{r.ledgerEntryId}</strong>
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
                RECOVERED PRINCIPAL
              </span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--rf-emerald-text)" }} className="font-mono tabular-nums">
                {formatMoney(r.actualAmount, r.currency)}
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-recon-detail-grid">
        {/* Card 1: Financial Balance Comparison */}
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
            <Scale size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Financial Balance Verification
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Expected Gross Amount:</span>
              <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono tabular-nums">
                {formatMoney(r.expectedAmount, r.currency)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Actual Recovered Amount:</span>
              <span style={{ fontWeight: 700, color: "var(--rf-emerald-text)" }} className="font-mono tabular-nums">
                {formatMoney(r.actualAmount, r.currency)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Discrepancy / Variance:</span>
              <span style={{ fontWeight: 700, color: r.discrepancy === 0 ? "var(--rf-emerald-text)" : "var(--rf-danger)" }} className="font-mono tabular-nums">
                {formatMoney(r.discrepancy, r.currency)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Acquiring Gateway:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }}>{r.provider}</span>
            </div>
            <div style={{ paddingTop: "8px", borderTop: "1px solid var(--rf-border-subtle)", fontSize: "12px", color: "var(--rf-text-secondary)" }}>
              <strong>Operational Note:</strong> {r.notes}
            </div>
          </div>
        </div>

        {/* Card 2: Entity Cross-Links */}
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
            <ShieldCheck size={15} color="var(--rf-emerald)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Authoritative Entity Relationships
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Recovery Case:</span>
              <Link href={`/cases/${encodeURIComponent(r.caseId)}`} style={{ fontWeight: 700, color: "var(--rf-navy-primary)", textDecoration: "none" }} className="font-mono hover:underline">
                {r.caseId}
              </Link>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Payment Intent:</span>
              <Link href={`/payments/${encodeURIComponent(r.paymentId)}`} style={{ fontWeight: 700, color: "var(--rf-text-secondary)", textDecoration: "none" }} className="font-mono hover:underline">
                {r.paymentId}
              </Link>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Queue Job:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }} className="font-mono">
                {r.jobId || "N/A"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <Link href={`/cases/${encodeURIComponent(r.caseId)}`} style={{ textDecoration: "none", flex: 1 }}>
                <Button variant="secondary" size="sm" style={{ width: "100%" }} icon={<ExternalLink size={12} />}>
                  Inspect Case
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
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .rf-recon-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
