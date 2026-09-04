"use client";

import React from "react";
import { useAnalytics } from "@/lib/api/useAnalytics";
import { AnalyticsHeader } from "./AnalyticsHeader";
import { AnalyticsMetricRail } from "./AnalyticsMetricRail";
import { RecoveryPerformance } from "./RecoveryPerformance";
import { RecoveryFunnel } from "./RecoveryFunnel";
import { FailureAnalysis } from "./FailureAnalysis";
import { ProviderPerformance } from "./ProviderPerformance";
import { OutcomeDistribution } from "./OutcomeDistribution";
import { AnalyticsInsight } from "./AnalyticsInsight";
import { DataQuality } from "./DataQuality";
import { AnalyticsOperationalLink } from "./AnalyticsOperationalLink";
import { AlertCircle, RefreshCw } from "lucide-react";

export const AnalyticsView: React.FC = () => {
  const {
    data,
    timeframe,
    setTimeframe,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useAnalytics("30D");

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%" }}>
        <div
          style={{
            height: "80px",
            borderRadius: "var(--rf-radius-surface)",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "14px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "140px",
                borderRadius: "var(--rf-radius-surface)",
                backgroundColor: "var(--rf-surface)",
                border: "1px solid var(--rf-border)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>

        <div
          style={{
            height: "320px",
            borderRadius: "var(--rf-radius-surface)",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          textAlign: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--rf-danger-surface)",
            border: "1px solid var(--rf-danger-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertCircle size={24} color="var(--rf-danger)" />
        </div>

        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
            Recovery Analytics Unavailable
          </h2>
          <p style={{ fontSize: "13px", color: "var(--rf-text-secondary)", marginTop: "4px", maxWidth: "450px" }}>
            {error || "Unable to synchronize analytical data from the recovery engine. Please retry."}
          </p>
        </div>

        <button
          onClick={refresh}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--rf-radius-control)",
            backgroundColor: "var(--rf-navy-primary)",
            color: "#FFFFFF",
            border: "none",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const activeBundle = data.timeframes[timeframe] || data.timeframes["30D"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxWidth: "100%",
      }}
      className="rf-analytics-workspace"
    >
      {/* 1. Header with Timeframe Selector */}
      <AnalyticsHeader
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        dataMode={data.qualityMeta.dataMode}
      />

      {/* 2. Executive Recovery Metrics Row */}
      <AnalyticsMetricRail
        metrics={activeBundle.executiveMetrics}
        timeframe={timeframe}
      />

      {/* 3. Primary Analytical Recovery Performance Comparison */}
      <RecoveryPerformance
        comparisonData={data.comparisonData}
        selectedTimeframe={timeframe}
        onSelectTimeframe={setTimeframe}
      />

      {/* 4. Two-Column Layout: Funnel & Failure Analysis */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Section 4: Recovery Funnel */}
        <RecoveryFunnel
          stages={activeBundle.funnelStages}
          timeframe={timeframe}
        />

        {/* Section 5: Failure Analysis */}
        <FailureAnalysis items={data.failureAnalysis} />
      </div>

      {/* 5. Provider Telemetry (Current State) */}
      <ProviderPerformance providers={data.providersTelemetry} />

      {/* 6. Outcome Distribution (Reconciled to 1,240 cases) */}
      <OutcomeDistribution
        totalCases={data.outcomeDistribution.totalCases}
        totalCasesLabel={data.outcomeDistribution.totalCasesLabel}
        slices={data.outcomeDistribution.slices}
      />

      {/* 7. Deterministic Recovery Signals */}
      <AnalyticsInsight insights={data.insights} />

      {/* 8. Data Quality & Ledger Validation */}
      <DataQuality quality={data.qualityMeta} />

      {/* 9. Operational System Linkage */}
      <AnalyticsOperationalLink />
    </div>
  );
};
