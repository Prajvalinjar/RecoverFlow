/**
 * RecoverFlow Analytics Domain & View Types
 * Strictly data-driven types supporting the Recovery Analytics workspace.
 */

export type AnalyticsTimeframe = "7D" | "30D" | "90D";

export interface AnalyticsExecutiveMetrics {
  attempts: number;
  recovered: number;
  recoveryRate: string;
  recoveryRateNum: number;
  recoveredRevenue: string;
  recoveredRevenueNum: number;
  revenueAtRisk: string;
  revenueAtRiskNum: number;
  currency: string;
  subtextAttempts: string;
  subtextRecovered: string;
  subtextRate: string;
  subtextRevenue: string;
}

export interface AnalyticsTrendPoint {
  label: string;
  attempts: number;
  recovered: number;
  rate: string;
  rateNum: number;
}

export interface AnalyticsFunnelStage {
  id: string;
  name: string;
  count: number;
  countLabel: string;
  pctOfTotal: string;
  conversionFromPrevious?: string;
  color: string;
  description: string;
}

export interface AnalyticsFailureItem {
  rank: string;
  code: string;
  displayName: string;
  count: number;
  pct: string;
  yieldRate: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  severityColor: string;
}

export interface AnalyticsProviderTelemetry {
  providerId: string;
  displayName: string;
  environment: "production" | "sandbox";
  state: string;
  latencyMs: number;
  circuitState: string;
  capabilitiesCount: number;
  isPrimary: boolean;
}

export interface AnalyticsOutcomeSlice {
  label: string;
  count: number;
  pct: string;
  color: string;
  description: string;
}

export interface AnalyticsDeterministicInsight {
  id: string;
  tag: string;
  title: string;
  observation: string;
  implication: string;
  badgeColor: string;
}

export interface AnalyticsDataQualityMeta {
  dataMode: "SANDBOX BASELINE" | "BACKEND CONNECTED";
  dataSource: string;
  dataState: "AVAILABLE" | "PARTIAL" | "FALLBACK";
  lastSync: string;
  currency: string;
  isHistoricalLive: boolean;
}

export interface AnalyticsTimeframeComparisonItem {
  timeframe: AnalyticsTimeframe;
  label: string;
  attempts: number;
  recovered: number;
  rate: string;
  rateNum: number;
  recoveredRevenue: string;
  isBaselineVerified: boolean;
}

export interface AnalyticsTimeframeBundle {
  executiveMetrics: AnalyticsExecutiveMetrics;
  funnelStages: AnalyticsFunnelStage[];
}

export interface AnalyticsDataBundle {
  qualityMeta: AnalyticsDataQualityMeta;
  timeframes: Record<AnalyticsTimeframe, AnalyticsTimeframeBundle>;
  comparisonData: AnalyticsTimeframeComparisonItem[];
  failureAnalysis: AnalyticsFailureItem[];
  providersTelemetry: AnalyticsProviderTelemetry[];
  outcomeDistribution: {
    totalCases: number;
    totalCasesLabel: string;
    slices: AnalyticsOutcomeSlice[];
  };
  insights: AnalyticsDeterministicInsight[];
}
