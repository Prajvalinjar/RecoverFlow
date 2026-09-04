"use client";

import React, { useState } from "react";
import Link from "next/link";
import { QueueControlState, SupportedControlAction } from "@/lib/types/operations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Layers, RefreshCw, Lock } from "lucide-react";
import { ConfirmationModal } from "./ConfirmationModal";

export interface QueueControlCardProps {
  queue: QueueControlState;
  isApplying: boolean;
  onDispatch: (action: SupportedControlAction) => Promise<void>;
}

export const QueueControlCard: React.FC<QueueControlCardProps> = ({
  queue,
  isApplying,
  onDispatch,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const isNormal = queue.backpressureLevel === "NORMAL";

  async function handleConfirm() {
    await onDispatch("RECONCILE_QUEUE");
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
          padding: "14px 18px",
          borderBottom: "1px solid var(--rf-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          backgroundColor: "var(--rf-canvas)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={16} color="var(--rf-navy-primary)" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
            Recovery Job Queue
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Badge
            status={isNormal ? "OPERATIONAL" : "ESCALATED"}
            label={`BACKPRESSURE: ${queue.backpressureLevel}`}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
            fontSize: "12px",
          }}
        >
          <div style={{ backgroundColor: "var(--rf-canvas)", padding: "10px", borderRadius: "6px", border: "1px solid var(--rf-border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
              QUEUED DEPTH
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {queue.queuedDepth}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--rf-canvas)", padding: "10px", borderRadius: "6px", border: "1px solid var(--rf-border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
              CLAIMED LEASES
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {queue.claimedLeases}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--rf-canvas)", padding: "10px", borderRadius: "6px", border: "1px solid var(--rf-border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
              SUCCEEDED
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-emerald)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {queue.succeeded}
            </div>
          </div>

          <div style={{ backgroundColor: "var(--rf-canvas)", padding: "10px", borderRadius: "6px", border: "1px solid var(--rf-border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--rf-text-muted)" }}>
              DEAD LETTER
            </div>
            <div style={{ fontWeight: 700, color: "var(--rf-danger)", marginTop: "2px", fontFamily: "var(--font-mono, monospace)" }}>
              {queue.deadLetter}
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            paddingTop: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--rf-text-muted)" }}>
            <Lock size={12} />
            <span>
              Queue pause/drain controls not exposed. Reconcile scans & repairs expired leases.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              href="/jobs"
              style={{
                fontSize: "12px",
                color: "var(--rf-cyan)",
                fontWeight: 600,
                textDecoration: "none",
                marginRight: "6px",
              }}
            >
              Jobs Queue →
            </Link>

            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => setIsModalOpen(true)}
              disabled={isApplying}
            >
              Reconcile Queue
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        action="RECONCILE_QUEUE"
        target="JOB_QUEUE"
        currentState={`Depth: ${queue.queuedDepth}`}
        requestedState="RECONCILED"
        isApplying={isApplying}
        onConfirm={handleConfirm}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
