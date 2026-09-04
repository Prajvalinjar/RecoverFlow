"use client";

import React from "react";
import { useOperations } from "@/lib/api/useOperations";
import { Button } from "@/components/ui/Button";
import { OperationsStateSummary } from "@/components/operations/OperationsStateSummary";
import { RecoveryControlCard } from "@/components/operations/RecoveryControlCard";
import { CircuitBreakerCard } from "@/components/operations/CircuitBreakerCard";
import { ProviderControlCard } from "@/components/operations/ProviderControlCard";
import { QueueControlCard } from "@/components/operations/QueueControlCard";
import { WorkerControlCard } from "@/components/operations/WorkerControlCard";
import { EmergencyControlCard } from "@/components/operations/EmergencyControlCard";
import { SafeguardsSection } from "@/components/operations/SafeguardsSection";
import { ControlHistoryTable } from "@/components/operations/ControlHistoryTable";
import { RefreshCw, Radio } from "lucide-react";

export default function OperationsControlPage() {
  const {
    overview,
    isLoading,
    isRefreshing,
    isApplying,
    isLive,
    error,
    feedback,
    refresh,
    dispatchAction,
  } = useOperations();

  if (isLoading && !overview) {
    return (
      <div
        style={{
          padding: "80px 20px",
          textAlign: "center",
          color: "var(--rf-text-muted)",
          fontSize: "14px",
        }}
      >
        Loading authoritative operations control status...
      </div>
    );
  }

  if (!overview) {
    return (
      <div
        style={{
          padding: "60px 20px",
          textAlign: "center",
          color: "var(--rf-danger)",
          fontSize: "14px",
        }}
      >
        {error || "Unable to load operational status."}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxWidth: "100%",
        paddingBottom: "40px",
      }}
    >
      {/* 1. Page Header & Breadcrumb */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingBottom: "18px",
          borderBottom: "1px solid var(--rf-border)",
        }}
      >
        {/* Breadcrumb */}
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
          <span>RECOVERFLOW</span>
          <span>/</span>
          <span>OPERATIONS</span>
          <span>/</span>
          <span style={{ color: "var(--rf-cyan)" }}>OPERATIONS CONTROL</span>
        </div>

        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Operations Control
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "13px",
                color: "var(--rf-text-secondary)",
              }}
            >
              Controlled recovery execution, system safeguards, and operational state management.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Live vs Sandbox Tag */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                backgroundColor: isLive ? "rgba(0, 178, 122, 0.08)" : "rgba(21, 151, 211, 0.08)",
                border: `1px solid ${isLive ? "var(--rf-emerald-border)" : "var(--rf-cyan-border)"}`,
                color: isLive ? "var(--rf-emerald)" : "var(--rf-cyan)",
              }}
            >
              <Radio size={12} />
              <span>{isLive ? "LIVE ENGINE" : "SANDBOX CONTROLLER"}</span>
            </div>

            {/* Refresh Button */}
            <Button
              variant="secondary"
              size="sm"
              icon={
                <RefreshCw
                  size={13}
                  className={isRefreshing ? "spin-animate" : ""}
                />
              }
              onClick={refresh}
              disabled={isRefreshing || isApplying}
            >
              Refresh State
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Current System State Summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "var(--rf-text-muted)",
            textTransform: "uppercase",
          }}
        >
          CURRENT SYSTEM STATE
        </div>
        <OperationsStateSummary overview={overview} />
      </div>

      {/* 3. Primary Execution Control */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "var(--rf-text-muted)",
            textTransform: "uppercase",
          }}
        >
          AVAILABLE OPERATIONS — RECOVERY EXECUTION
        </div>
        <RecoveryControlCard
          recovery={overview.recovery}
          feedback={feedback}
          isApplying={isApplying}
          onDispatch={async (action) => {
            await dispatchAction(action);
          }}
        />
      </div>

      {/* 4. Subsystem Controls & Unexposed Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "var(--rf-text-muted)",
            textTransform: "uppercase",
          }}
        >
          SUBSYSTEM OPERATIONAL STATES & SAFEGUARDS
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "14px",
          }}
        >
          <CircuitBreakerCard circuit={overview.circuit} />
          <ProviderControlCard providers={overview.providers} />
          <QueueControlCard
            queue={overview.queue}
            isApplying={isApplying}
            onDispatch={async (action) => {
              await dispatchAction(action);
            }}
          />
          <WorkerControlCard workers={overview.workers} />
        </div>
      </div>

      {/* 5. Emergency Control (Restrained Informational Section) */}
      <EmergencyControlCard />

      {/* 6. Operational Safeguards & Policy Boundary */}
      <SafeguardsSection safeguards={overview.safeguards} />

      {/* 7. Control History & Audit Trail */}
      <ControlHistoryTable events={overview.recentEvents} />

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .spin-animate {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
