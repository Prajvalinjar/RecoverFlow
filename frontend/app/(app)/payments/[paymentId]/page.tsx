"use client";

import React, { use } from "react";
import Link from "next/link";
import { usePaymentDetail } from "@/lib/api/usePaymentDetail";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import {
  ArrowLeft,
  RefreshCw,
  CreditCard,
  AlertOctagon,
  ShieldCheck,
  Cpu,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function PaymentDetailPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = use(params);
  const { paymentData, isLoading, isRefreshing, isNotFound, refresh } = usePaymentDetail(paymentId);

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
            Payment Not Found
          </h2>
          <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", marginBottom: "20px" }}>
            The requested payment transaction &ldquo;{paymentId}&rdquo; could not be located in the ledger.
          </p>
          <Link href="/payments" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" icon={<ArrowLeft size={14} />}>
              Back to Payments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !paymentData) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--rf-text-muted)" }}>
        Loading payment transaction details for {paymentId}...
      </div>
    );
  }

  const p = paymentData!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%" }}>
      {/* 1. Header & Navigation Backlink */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--rf-border)",
        }}
      >
        {/* Backlink & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/payments"
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
            <span>Back to Payments</span>
          </Link>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--rf-text-muted)" }} className="font-mono">
            PAYMENT TRANSACTION: {p.paymentId}
          </span>
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
                {p.paymentId}
              </h1>
              <Badge
                status={
                  p.status === "FAILED"
                    ? "FAILED"
                    : p.status === "SUCCESS" || p.status === "RECOVERED"
                    ? "RECOVERED"
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
                  color: "var(--rf-text-secondary)",
                  border: "1px solid var(--rf-border)",
                }}
                className="font-mono"
              >
                PROVIDER: {p.provider}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--rf-text-secondary)" }}>
              Created on {formatDate(p.createdAt)} • Customer: <strong>{p.customerName || p.customerId}</strong>
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
                GROSS AMOUNT
              </span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--rf-navy-primary)" }} className="font-mono tabular-nums">
                {formatMoney(p.amount, p.currency)}
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

      {/* 2. Top Grid: Transaction Scope & Failure Diagnostics (50/50 Grid) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-payment-detail-grid">
        {/* Card 1: Payment & Transaction Details */}
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
            <CreditCard size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Transaction Scope & Identity
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Payment ID:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {p.paymentId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Customer Reference:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }}>{p.customerId}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Customer Segment:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-cyan-text)" }}>{p.customerSegment}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Gross Amount:</span>
              <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }} className="font-mono tabular-nums">
                {formatMoney(p.amount, p.currency)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Provider Reference:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }} className="font-mono">
                {p.providerReference}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Failure Diagnostics */}
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
            <AlertOctagon size={15} color="var(--rf-danger)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Payment Failure Diagnostics
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Failure Code:</span>
              {p.failureCode ? (
                <code
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    backgroundColor: "var(--rf-danger-surface)",
                    color: "var(--rf-danger-text)",
                    border: "1px solid var(--rf-danger-border)",
                    borderRadius: "4px",
                  }}
                  className="font-mono"
                >
                  {p.failureCode}
                </code>
              ) : (
                <span style={{ color: "var(--rf-text-muted)" }}>None (Payment Succeeded)</span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Failure Description:</span>
              <span style={{ fontWeight: 550, color: "var(--rf-navy-primary)", textAlign: "right", maxWidth: "60%" }}>
                {p.failureReason || "No failure recorded."}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Gateway Protocol:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-text-secondary)" }}>HTTPS Idempotent Webhook</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Signal Ingested:</span>
              <span style={{ fontWeight: 600, color: "var(--rf-emerald-text)" }}>HMAC Verified Signature</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Grid: Linked Recovery Case & Orchestration Linkage (50/50 Grid) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-payment-detail-grid">
        {/* Card 3: Linked Recovery Case */}
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
              justifyContent: "space-between",
              backgroundColor: "var(--rf-surface-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={15} color="var(--rf-emerald)" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
                Linked Recovery Case
              </span>
            </div>

            {p.caseState && (
              <Badge
                status={
                  p.caseState === "RECOVERED"
                    ? "RECOVERED"
                    : p.caseState === "FAILED"
                    ? "FAILED"
                    : "ACTIVE"
                }
                size="sm"
              />
            )}
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {p.caseId ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <span style={{ color: "var(--rf-text-muted)" }}>Case Identifier:</span>
                  <Link
                    href={`/cases/${encodeURIComponent(p.caseId)}`}
                    style={{
                      fontWeight: 700,
                      color: "var(--rf-navy-primary)",
                      textDecoration: "none",
                    }}
                    className="font-mono hover:underline"
                  >
                    {p.caseId}
                  </Link>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <span style={{ color: "var(--rf-text-muted)" }}>Execution Progress:</span>
                  <span style={{ fontWeight: 600, color: "var(--rf-navy-primary)" }} className="font-mono">
                    {p.caseAttemptCount}/{p.caseMaxAttempts} Attempts Executed
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <Link href={`/cases/${encodeURIComponent(p.caseId)}`} style={{ textDecoration: "none", flex: 1 }}>
                    <Button variant="secondary" size="sm" style={{ width: "100%" }} icon={<ExternalLink size={12} />}>
                      Inspect Recovery Case
                    </Button>
                  </Link>
                  <Link href="/recovery-flow" style={{ textDecoration: "none", flex: 1 }}>
                    <Button variant="ghost" size="sm" style={{ width: "100%" }} icon={<Cpu size={12} />}>
                      Recovery Flow
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--rf-text-muted)", fontSize: "13px", padding: "10px 0" }}>
                No active recovery case registered for this payment transaction.
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Provider Gateway Metadata */}
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
              Provider Gateway Metadata
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Acquiring Gateway:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }}>{p.provider}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Environment Mode:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-cyan-text)" }}>
                {p.isLive ? "PRODUCTION LIVE" : "SANDBOX SIMULATION"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Circuit Breaker:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-emerald-text)" }}>CLOSED (Healthy)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Chronological Payment Event Stream */}
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
            backgroundColor: "var(--rf-surface-subtle)",
            borderBottom: "1px solid var(--rf-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Chronological Payment Event Stream
            </span>
          </div>

          <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }} className="font-mono">
            {p.timeline.length} EVENTS RECORDED
          </span>
        </div>

        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {p.timeline.map((evt, idx) => (
            <div
              key={evt.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: "var(--rf-surface-subtle)",
                border: "1px solid var(--rf-border-subtle)",
                borderRadius: "var(--rf-radius-control)",
                fontSize: "12px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--rf-text-muted)", width: "20px" }} className="font-mono">
                  0{idx + 1}
                </span>
                {evt.status === "SUCCESS" ? (
                  <CheckCircle2 size={13} color="var(--rf-emerald)" />
                ) : evt.status === "FAILED" ? (
                  <XCircle size={13} color="var(--rf-danger)" />
                ) : (
                  <Clock size={13} color="var(--rf-cyan)" />
                )}
                <span style={{ fontWeight: 700, color: "var(--rf-navy-primary)" }}>{evt.title}</span>
              </div>

              <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)", flex: 1, minWidth: "180px" }}>
                {evt.description}
              </span>

              <span style={{ fontSize: "11px", color: "var(--rf-text-muted)", whiteSpace: "nowrap" }} className="font-mono">
                {formatDate(evt.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .rf-payment-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
