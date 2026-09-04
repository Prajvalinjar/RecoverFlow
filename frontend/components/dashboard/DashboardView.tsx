"use client";

import React from "react";
import { DashboardHeader } from "./DashboardHeader";
import { RecoveryPulseRail } from "./RecoveryPulseRail";
import { RecoveryPerformanceChart } from "./RecoveryPerformanceChart";
import { RecoveryHealthDonut } from "./RecoveryHealthDonut";
import { RevenueProtectionSection } from "./RevenueProtectionSection";
import { FailureIntelligenceSection } from "./FailureIntelligenceSection";
import { RecentActivityTable } from "./RecentActivityTable";
import { BottomTelemetryRail } from "./BottomTelemetryRail";
import { useDashboardData } from "@/lib/api/useDashboardData";
import { Info, AlertTriangle } from "lucide-react";

export const DashboardView: React.FC = () => {
  const { data, isRefreshing, error, refresh } = useDashboardData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Notice / Status Banner if in Sandbox Mode or Partial Error */}
      {data?.dataSourceNotice && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 14px",
            backgroundColor: "var(--rf-surface-light-blue)",
            border: "1px solid var(--rf-cyan-border)",
            borderRadius: "var(--rf-radius-control)",
            fontSize: "12px",
            color: "var(--rf-cyan-text)",
          }}
        >
          <Info size={14} style={{ flexShrink: 0 }} />
          <span>{data.dataSourceNotice}</span>
        </div>
      )}

      {error && !data && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            backgroundColor: "var(--rf-warning-surface)",
            border: "1px solid var(--rf-warning-border)",
            borderRadius: "var(--rf-radius-control)",
            fontSize: "12.5px",
            color: "var(--rf-warning-text)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>DATA SOURCE NOTICE: {error} • Serving Sandbox Baseline</span>
          </div>
          <button
            onClick={() => refresh()}
            style={{
              padding: "2px 8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--rf-warning-border)",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 650,
              color: "var(--rf-warning-text)",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Dashboard Header */}
      <DashboardHeader headerMeta={data?.headerMeta} />

      {/* 2. Recovery Pulse Connected Metric Rail */}
      <RecoveryPulseRail metrics={data?.pulseMetrics} />

      {/* 3. Primary Analytics Row: 68 / 32 Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "68% calc(32% - 20px)",
          gap: "20px",
        }}
        className="rf-primary-analytics-grid"
      >
        <RecoveryPerformanceChart
          timeframes={data?.performanceChart?.timeframes}
          isHistoricalLive={data?.performanceChart?.isHistoricalLive}
        />
        <RecoveryHealthDonut healthData={data?.recoveryHealth} />
      </div>

      {/* 4. Second Analytics Row: 50 / 50 Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
        className="rf-secondary-analytics-grid"
      >
        <RevenueProtectionSection protectionData={data?.revenueProtection} />
        <FailureIntelligenceSection failureItems={data?.failureIntelligence} />
      </div>

      {/* 5. Recent Operational Activity Table */}
      <RecentActivityTable
        records={data?.recentActivity}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />

      {/* 6. Bottom Telemetry Rail */}
      <BottomTelemetryRail telemetry={data?.telemetryRail} />

      <style jsx global>{`
        @media (max-width: 1200px) {
          .rf-primary-analytics-grid {
            grid-template-columns: 1fr !important;
          }
          .rf-secondary-analytics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
