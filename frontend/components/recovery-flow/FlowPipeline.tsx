"use client";

import React from "react";
import { FlowStep } from "@/lib/types/recoveryFlow";
import { CheckCircle2, Clock, XCircle, Sparkles, Shield, ArrowRight } from "lucide-react";

interface FlowPipelineProps {
  steps: FlowStep[];
  isLoading?: boolean;
}

export const FlowPipeline: React.FC<FlowPipelineProps> = ({ steps, isLoading = false }) => {
  function getStepIcon(status: FlowStep["status"]) {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 size={13} color="var(--rf-emerald)" />;
      case "ACTIVE":
        return <Clock size={13} color="var(--rf-cyan)" />;
      case "AI_ADVISORY":
        return <Sparkles size={13} color="var(--rf-ai-violet)" />;
      case "FAILED":
      case "BLOCKED":
        return <XCircle size={13} color="var(--rf-danger)" />;
      case "PENDING":
      default:
        return <Shield size={13} color="var(--rf-text-muted)" />;
    }
  }

  function getStatusStyles(status: FlowStep["status"]) {
    switch (status) {
      case "COMPLETED":
        return {
          bg: "var(--rf-emerald-surface)",
          border: "var(--rf-emerald-border)",
          text: "var(--rf-emerald-text)",
        };
      case "ACTIVE":
        return {
          bg: "var(--rf-surface-light-blue)",
          border: "var(--rf-cyan-border)",
          text: "var(--rf-cyan-text)",
        };
      case "AI_ADVISORY":
        return {
          bg: "var(--rf-ai-surface)",
          border: "var(--rf-ai-border)",
          text: "var(--rf-ai-violet)",
        };
      case "FAILED":
      case "BLOCKED":
        return {
          bg: "var(--rf-danger-surface)",
          border: "var(--rf-danger-border)",
          text: "var(--rf-danger-text)",
        };
      case "PENDING":
      default:
        return {
          bg: "var(--rf-canvas)",
          border: "var(--rf-border)",
          text: "var(--rf-text-muted)",
        };
    }
  }

  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: isLoading ? 0.7 : 1,
        transition: "opacity 150ms ease",
      }}
    >
      {/* Header */}
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
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: "3px",
              backgroundColor: "var(--rf-surface)",
              border: "1px solid var(--rf-border)",
              color: "var(--rf-navy-primary)",
            }}
            className="font-mono"
          >
            END-TO-END
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
            Orchestration Lifecycle Pipeline
          </span>
        </div>

        <span style={{ fontSize: "11px", color: "var(--rf-text-muted)" }} className="font-mono">
          8 RECOVERY PHASES
        </span>
      </div>

      {/* Pipeline Track */}
      <div
        style={{
          padding: "20px 16px",
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: "8px",
          position: "relative",
          overflowX: "auto",
        }}
        className="rf-flow-pipeline-grid"
      >
        {steps.map((step, idx) => {
          const style = getStatusStyles(step.status);
          return (
            <div
              key={step.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "12px 10px",
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: "var(--rf-radius-control)",
                position: "relative",
                minWidth: "125px",
              }}
            >
              {/* Step indicator */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: style.text,
                  }}
                  className="font-mono"
                >
                  0{step.stepNumber}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {getStepIcon(step.status)}
                  {idx < steps.length - 1 && (
                    <ArrowRight size={10} color="var(--rf-border)" className="rf-flow-arrow" />
                  )}
                </div>
              </div>

              {/* Step title */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "var(--rf-navy-primary)",
                    lineHeight: 1.25,
                  }}
                >
                  {step.title}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: style.text,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                  className="font-mono"
                >
                  {step.subtitle}
                </span>
              </div>

              {/* Technical Detail */}
              {step.technicalDetail && (
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "6px",
                    borderTop: `1px solid ${style.border}`,
                    fontSize: "9.5px",
                    color: "var(--rf-text-secondary)",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                  className="font-mono"
                >
                  {step.technicalDetail}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @media (max-width: 1200px) {
          .rf-flow-pipeline-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .rf-flow-pipeline-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .rf-flow-pipeline-grid {
            grid-template-columns: 1fr !important;
          }
          .rf-flow-arrow {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
