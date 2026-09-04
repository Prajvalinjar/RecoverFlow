"use client";

import React, { useState } from "react";
import { RecoveryExecutionState, SupportedControlAction } from "@/lib/types/operations";
import { ActionFeedback } from "@/lib/api/useOperations";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PauseCircle, PlayCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { ConfirmationModal } from "./ConfirmationModal";

export interface RecoveryControlCardProps {
  recovery: RecoveryExecutionState;
  feedback: ActionFeedback;
  isApplying: boolean;
  onDispatch: (action: SupportedControlAction) => Promise<void>;
}

export const RecoveryControlCard: React.FC<RecoveryControlCardProps> = ({
  recovery,
  feedback,
  isApplying,
  onDispatch,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const isRunning = recovery.status === "RUNNING";
  const targetAction: SupportedControlAction = isRunning ? "PAUSE_RECOVERY" : "RESUME_RECOVERY";

  async function handleConfirm() {
    await onDispatch(targetAction);
    setIsModalOpen(false);
  }

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        border: "1px solid var(--rf-border)",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(16, 42, 67, 0.03)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--rf-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          backgroundColor: isRunning ? "rgba(0, 178, 122, 0.02)" : "rgba(229, 72, 77, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              backgroundColor: isRunning ? "rgba(0, 178, 122, 0.1)" : "rgba(229, 72, 77, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isRunning ? "var(--rf-emerald)" : "var(--rf-danger)",
            }}
          >
            {isRunning ? <PlayCircle size={20} /> : <PauseCircle size={20} />}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Recovery Execution Control
            </div>
            <div style={{ fontSize: "12px", color: "var(--rf-text-muted)" }}>
              Authoritative runtime engine processing control
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
            CURRENT STATE:
          </span>
          <Badge
            status={isRunning ? "OPERATIONAL" : "FAILED"}
            label={isRunning ? "OPERATIONAL" : "PAUSED"}
          />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Action Feedback Banner */}
        {feedback.status === "REQUESTING" && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(21, 151, 211, 0.08)",
              border: "1px solid var(--rf-cyan-border)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--rf-cyan-text)",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                border: "2px solid currentColor",
                borderRightColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
            <span>{feedback.message}</span>
          </div>
        )}

        {feedback.status === "SUCCESS" && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(0, 178, 122, 0.08)",
              border: "1px solid var(--rf-emerald-border)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--rf-emerald-text)",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{feedback.message}</span>
          </div>
        )}

        {feedback.status === "FAILED" && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(229, 72, 77, 0.08)",
              border: "1px solid var(--rf-danger-border)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--rf-danger-text)",
            }}
          >
            <AlertCircle size={16} />
            <span>
              {feedback.error ? `Error: ${feedback.error}. ` : ""}
              {feedback.message}
            </span>
          </div>
        )}

        {/* State metadata grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            backgroundColor: "var(--rf-canvas)",
            padding: "14px",
            borderRadius: "6px",
            border: "1px solid var(--rf-border)",
            fontSize: "12px",
          }}
        >
          <div>
            <div style={{ color: "var(--rf-text-muted)", fontSize: "11px", fontWeight: 600 }}>
              NEW JOB EXECUTION
            </div>
            <div style={{ fontWeight: 600, color: "var(--rf-navy-primary)", marginTop: "3px" }}>
              {recovery.canExecuteNewJobs ? "Permitted" : "Blocked"}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--rf-text-muted)", fontSize: "11px", fontWeight: 600 }}>
              EXECUTION AUTHORITY
            </div>
            <div style={{ fontWeight: 600, color: "var(--rf-navy-primary)", marginTop: "3px" }}>
              Policy Engine (100% Authority)
            </div>
          </div>

          <div>
            <div style={{ color: "var(--rf-text-muted)", fontSize: "11px", fontWeight: 600 }}>
              AUDIT GENERATION
            </div>
            <div style={{ fontWeight: 600, color: "var(--rf-navy-primary)", marginTop: "3px" }}>
              PostgreSQL Ledger Logged
            </div>
          </div>

          <div>
            <div style={{ color: "var(--rf-text-muted)", fontSize: "11px", fontWeight: 600 }}>
              REVERSIBILITY
            </div>
            <div style={{ fontWeight: 600, color: "var(--rf-navy-primary)", marginTop: "3px" }}>
              Fully Reversible
            </div>
          </div>
        </div>

        {/* Explanation and Control Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            paddingTop: "6px",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--rf-text-secondary)", maxWidth: "540px" }}>
            {isRunning ? (
              <span>
                Pausing halts initiation of new recovery attempts. Active in-flight worker executions
                will finish without interruption, but no subsequent jobs will be dispatched.
              </span>
            ) : (
              <span>
                Recovery engine is currently paused. Resuming will immediately re-enable policy-approved
                job scheduling across active workers.
              </span>
            )}
          </div>

          <Button
            variant={isRunning ? "danger" : "primary"}
            size="md"
            icon={isRunning ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
            onClick={() => setIsModalOpen(true)}
            disabled={isApplying}
          >
            {isRunning ? "Pause Recovery" : "Resume Recovery"}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        action={targetAction}
        target="RECOVERY_ENGINE"
        currentState={isRunning ? "OPERATIONAL" : "PAUSED"}
        requestedState={isRunning ? "PAUSED" : "OPERATIONAL"}
        isApplying={isApplying}
        onConfirm={handleConfirm}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
