"use client";

import React, { useEffect } from "react";
import { SupportedControlAction } from "@/lib/types/operations";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ConfirmationModalProps {
  isOpen: boolean;
  action: SupportedControlAction;
  target: string;
  currentState: string;
  requestedState: string;
  isApplying: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  action,
  target,
  currentState,
  requestedState,
  isApplying,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isApplying) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isApplying, onClose]);

  if (!isOpen) return null;

  const isDestructive = action === "PAUSE_RECOVERY";
  const actionTitle = action.replace(/_/g, " ");

  const warningText =
    action === "PAUSE_RECOVERY"
      ? "Pausing recovery will block all new recovery jobs from executing. Active jobs will finish, but automated revenue recovery will halt until an operator resumes the engine."
      : action === "RESUME_RECOVERY"
      ? "Resuming recovery will immediately re-enable policy-approved recovery job processing and schedule pending eligible jobs."
      : "Queue reconciliation scans for orphaned leases and repairs stale job claims across distributed worker nodes.";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(6, 26, 43, 0.65)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isApplying) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid var(--rf-border)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          width: "100%",
          maxWidth: "460px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--rf-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDestructive ? "rgba(229, 72, 77, 0.04)" : "var(--rf-canvas)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: isDestructive ? "rgba(229, 72, 77, 0.12)" : "rgba(21, 151, 211, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isDestructive ? "var(--rf-danger)" : "var(--rf-cyan)",
              }}
            >
              {isDestructive ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <div
                id="modal-title"
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--rf-navy-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                Confirm Operational Action
              </div>
              <div style={{ fontSize: "11px", color: "var(--rf-text-muted)" }}>
                Deliberate Operator Confirmation Required
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isApplying}
            style={{
              background: "none",
              border: "none",
              color: "var(--rf-text-muted)",
              cursor: isApplying ? "not-allowed" : "pointer",
              padding: "4px",
              display: "flex",
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Target & States Matrix */}
          <div
            style={{
              backgroundColor: "var(--rf-canvas)",
              borderRadius: "6px",
              border: "1px solid var(--rf-border)",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--rf-text-muted)", fontWeight: 600 }}>ACTION</span>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  color: isDestructive ? "var(--rf-danger)" : "var(--rf-navy-primary)",
                }}
              >
                {actionTitle}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--rf-text-muted)", fontWeight: 600 }}>TARGET</span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--rf-navy-primary)" }}>
                {target}
              </span>
            </div>

            <div
              style={{
                height: "1px",
                backgroundColor: "var(--rf-border)",
                margin: "2px 0",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--rf-text-muted)", fontWeight: 600 }}>CURRENT STATE</span>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 600,
                  color: "var(--rf-text-secondary)",
                }}
              >
                {currentState}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--rf-text-muted)", fontWeight: 600 }}>REQUESTED STATE</span>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  color: isDestructive ? "var(--rf-danger)" : "var(--rf-emerald)",
                }}
              >
                {requestedState}
              </span>
            </div>
          </div>

          {/* Impact notice */}
          <div
            style={{
              fontSize: "12px",
              lineHeight: 1.5,
              color: "var(--rf-text-secondary)",
              padding: "10px 12px",
              backgroundColor: isDestructive ? "rgba(229, 72, 77, 0.05)" : "rgba(21, 151, 211, 0.05)",
              borderLeft: `3px solid ${isDestructive ? "var(--rf-danger)" : "var(--rf-cyan)"}`,
              borderRadius: "0 4px 4px 0",
            }}
          >
            {warningText}
          </div>
        </div>

        {/* Actions Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--rf-border)",
            backgroundColor: "var(--rf-canvas)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isApplying}
          >
            Cancel
          </Button>

          <Button
            variant={isDestructive ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={isApplying}
            disabled={isApplying}
          >
            {isApplying ? "APPLYING..." : `Confirm ${actionTitle}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
