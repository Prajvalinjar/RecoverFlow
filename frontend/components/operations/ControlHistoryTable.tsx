"use client";

import React from "react";
import Link from "next/link";
import { OperationalControlEvent } from "@/lib/types/operations";
import { Badge } from "@/components/ui/Badge";
import { History, ExternalLink } from "lucide-react";

export interface ControlHistoryTableProps {
  events: OperationalControlEvent[];
}

export const ControlHistoryTable: React.FC<ControlHistoryTableProps> = ({ events }) => {
  function formatTimestamp(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return iso;
    }
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
          backgroundColor: "var(--rf-canvas)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <History size={16} color="var(--rf-navy-primary)" />
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Operational Control History & Audit Trail
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--rf-text-muted)" }}>
              Authoritative record of system mutations emitted to PostgreSQL audit ledger
            </div>
          </div>
        </div>

        <Link
          href="/audit"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--rf-cyan)",
            textDecoration: "none",
          }}
        >
          View Full Audit Trail <ExternalLink size={12} />
        </Link>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "12px",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--rf-border)",
                backgroundColor: "rgba(16, 42, 67, 0.02)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--rf-text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              <th style={{ padding: "10px 16px" }}>TIMESTAMP</th>
              <th style={{ padding: "10px 16px" }}>ACTION</th>
              <th style={{ padding: "10px 16px" }}>ACTOR</th>
              <th style={{ padding: "10px 16px" }}>TARGET</th>
              <th style={{ padding: "10px 16px" }}>RESULT</th>
              <th style={{ padding: "10px 16px" }}>CORRELATION ID</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "var(--rf-text-muted)",
                  }}
                >
                  No operational control events recorded yet.
                </td>
              </tr>
            ) : (
              events.map((ev, idx) => (
                <tr
                  key={ev.eventId || idx}
                  style={{
                    borderBottom: "1px solid var(--rf-border)",
                    transition: "background-color 100ms ease",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "11.5px",
                      color: "var(--rf-text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatTimestamp(ev.timestamp)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontWeight: 600,
                        fontSize: "11.5px",
                        color:
                          ev.action.includes("PAUSED")
                            ? "var(--rf-danger)"
                            : ev.action.includes("RESUMED")
                            ? "var(--rf-emerald)"
                            : "var(--rf-navy-primary)",
                      }}
                    >
                      {ev.action}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--rf-text-primary)", fontWeight: 500 }}>
                    {ev.actor}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "11px",
                      color: "var(--rf-text-muted)",
                    }}
                  >
                    {ev.target}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      status={ev.result === "SUCCESS" ? "OPERATIONAL" : "FAILED"}
                      label={ev.result}
                      size="sm"
                    />
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "11px",
                      color: "var(--rf-cyan)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ev.correlationId}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
