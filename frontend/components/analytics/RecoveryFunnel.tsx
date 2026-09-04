"use client";

import React from "react";
import { AnalyticsFunnelStage } from "@/lib/types/analytics";
import { ArrowDown, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

export interface RecoveryFunnelProps {
  stages: AnalyticsFunnelStage[];
  timeframe: string;
}

export const RecoveryFunnel: React.FC<RecoveryFunnelProps> = ({ stages, timeframe }) => {
  const getStageIcon = (idx: number) => {
    if (idx === 0) return <AlertCircle size={16} color="var(--rf-navy-primary)" />;
    if (idx === 1) return <ShieldCheck size={16} color="var(--rf-cyan)" />;
    return <CheckCircle2 size={16} color="var(--rf-emerald)" />;
  };

  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Recovery Funnel
            </h2>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: "var(--rf-warning-text)",
                backgroundColor: "var(--rf-warning-surface)",
                border: "1px solid var(--rf-warning-border)",
                padding: "2px 6px",
                borderRadius: "var(--rf-radius-badge)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              SANDBOX BASELINE
            </span>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--rf-text-secondary)", marginTop: "2px" }}>
            Conversion through ingestion, deterministic policy qualification, and verified settlement ({timeframe}).
          </p>
        </div>
      </div>

      {/* Funnel Pipeline Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {stages.map((stage, idx) => {
          const maxCount = stages[0]?.count || 1;
          const barPct = Math.max(12, Math.round((stage.count / maxCount) * 100));

          return (
            <React.Fragment key={stage.id}>
              {idx > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    paddingLeft: "24px",
                    color: "var(--rf-text-muted)",
                    fontSize: "11px",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  <ArrowDown size={14} />
                  <span
                    style={{
                      padding: "2px 6px",
                      backgroundColor: "var(--rf-canvas)",
                      border: "1px solid var(--rf-border-subtle)",
                      borderRadius: "3px",
                      color: idx === 2 ? "var(--rf-emerald-text)" : "var(--rf-text-secondary)",
                      fontWeight: 650,
                    }}
                  >
                    {stage.conversionFromPrevious}
                  </span>
                </div>
              )}

              <div
                style={{
                  border: "1px solid var(--rf-border-subtle)",
                  borderRadius: "var(--rf-radius-control)",
                  padding: "14px 16px",
                  backgroundColor: "var(--rf-surface-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "26px",
                        height: "26px",
                        borderRadius: "4px",
                        backgroundColor: "var(--rf-surface)",
                        border: "1px solid var(--rf-border)",
                      }}
                    >
                      {getStageIcon(idx)}
                    </div>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 650, color: "var(--rf-navy-primary)" }}>
                        {stage.name}
                      </span>
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "11px",
                          color: "var(--rf-text-muted)",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}
                      >
                        STAGE 0{idx + 1}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: stage.color,
                      }}
                      className="font-mono tabular-nums"
                    >
                      {stage.countLabel}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--rf-text-muted)",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}
                    >
                      ({stage.pctOfTotal})
                    </span>
                  </div>
                </div>

                {/* Progress bar representing funnel depth */}
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    backgroundColor: "var(--rf-border-subtle)",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: "100%",
                      backgroundColor: stage.color,
                      borderRadius: "3px",
                      transition: "width 300ms ease",
                    }}
                  />
                </div>

                <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)" }}>
                  {stage.description}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
