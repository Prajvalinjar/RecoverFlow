"use client";

import React, { useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { RefreshCw } from "lucide-react";
import { ActivityStreamItem } from "@/lib/types/dashboard";

export interface RecentActivityTableProps {
  records?: ActivityStreamItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const DEFAULT_ACTIVITY: ActivityStreamItem[] = [
  {
    caseId: "CASE-2026-9812",
    paymentId: "pay_9xM8k21Lm",
    failureCode: "BANK_TIMEOUT",
    provider: "Razorpay Gateway",
    amount: "$14,850.00",
    status: "RECOVERED",
    attempts: "2/3",
    time: "2 mins ago",
  },
  {
    caseId: "CASE-2026-9811",
    paymentId: "pay_7vP31q82B",
    failureCode: "NETWORK_FAILURE",
    provider: "Razorpay Gateway",
    amount: "$4,290.00",
    status: "ACTIVE",
    attempts: "1/3",
    time: "6 mins ago",
  },
  {
    caseId: "CASE-2026-9810",
    paymentId: "pay_4nL52k91Z",
    failureCode: "AUTHENTICATION_FAILURE",
    provider: "Razorpay Gateway",
    amount: "$28,400.00",
    status: "MANUAL_REVIEW",
    attempts: "3/3",
    time: "11 mins ago",
  },
  {
    caseId: "CASE-2026-9809",
    paymentId: "pay_1mQ84v29C",
    failureCode: "BANK_TIMEOUT",
    provider: "Razorpay Gateway",
    amount: "$1,820.00",
    status: "RECOVERED",
    attempts: "1/3",
    time: "18 mins ago",
  },
  {
    caseId: "CASE-2026-9808",
    paymentId: "pay_8kR29p41D",
    failureCode: "GATEWAY_DOWN",
    provider: "Razorpay Gateway",
    amount: "$9,450.00",
    status: "QUEUED",
    attempts: "0/3",
    time: "24 mins ago",
  },
  {
    caseId: "CASE-2026-9807",
    paymentId: "pay_3xZ18m72A",
    failureCode: "CARD_DECLINED",
    provider: "Razorpay Gateway",
    amount: "$6,180.00",
    status: "FAILED",
    attempts: "3/3",
    time: "32 mins ago",
  },
];

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({
  records = DEFAULT_ACTIVITY,
  onRefresh,
  isRefreshing = false,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const activityList = records && records.length > 0 ? records : DEFAULT_ACTIVITY;

  const filteredData =
    filterStatus === "ALL"
      ? activityList
      : activityList.filter((r) => r.status === filterStatus);

  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      className="rf-activity-container"
    >
      {/* Table Header Controls */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--rf-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Recent Recovery Activity
            </span>
            <span style={{ fontSize: "12px", color: "var(--rf-text-muted)" }}>
              • Real-time Stream
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--rf-text-secondary)" }}>
            Live payment failure ingestion and autonomous remediation events
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Status quick filters */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--rf-canvas)",
              border: "1px solid var(--rf-border)",
              borderRadius: "var(--rf-radius-control)",
              padding: "2px",
            }}
          >
            {(["ALL", "RECOVERED", "ACTIVE", "MANUAL_REVIEW"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "3px 8px",
                  fontSize: "11px",
                  fontWeight: filterStatus === s ? 650 : 500,
                  backgroundColor: filterStatus === s ? "var(--rf-surface)" : "transparent",
                  color: filterStatus === s ? "var(--rf-navy-primary)" : "var(--rf-text-muted)",
                  border: filterStatus === s ? "1px solid var(--rf-border)" : "1px solid transparent",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            icon={
              <RefreshCw
                size={12}
                style={{
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                }}
              />
            }
          >
            {isRefreshing ? "Syncing..." : "Sync"}
          </Button>
        </div>
      </div>

      {/* Table Surface */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "var(--rf-surface-subtle)",
                borderBottom: "1px solid var(--rf-border)",
              }}
            >
              <th
                style={{
                  padding: "11px 18px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                }}
              >
                CASE ID
              </th>
              <th
                style={{
                  padding: "11px 16px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                }}
              >
                PAYMENT
              </th>
              <th
                style={{
                  padding: "11px 16px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                }}
              >
                FAILURE
              </th>
              <th
                style={{
                  padding: "11px 16px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                }}
              >
                PROVIDER
              </th>
              <th
                style={{
                  padding: "11px 16px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                  textAlign: "right",
                }}
              >
                AMOUNT
              </th>
              <th
                style={{
                  padding: "11px 16px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                }}
              >
                STATUS
              </th>
              <th
                style={{
                  padding: "11px 16px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                  textAlign: "center",
                }}
              >
                ATTEMPTS
              </th>
              <th
                style={{
                  padding: "11px 16px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                  textAlign: "right",
                }}
              >
                TIME
              </th>
              <th
                style={{
                  padding: "11px 18px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                  textAlign: "right",
                }}
              >
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr
                key={row.caseId}
                style={{
                  borderBottom:
                    idx === filteredData.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
                  transition: "background-color 100ms ease",
                }}
                className="rf-table-row"
              >
                {/* Case ID */}
                <td style={{ padding: "12px 18px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontWeight: 650,
                      color: "var(--rf-navy-primary)",
                      fontSize: "12.5px",
                    }}
                    className="font-mono"
                  >
                    {row.caseId}
                  </span>
                </td>

                {/* Payment ID */}
                <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                  <span
                    style={{ color: "var(--rf-text-secondary)", fontSize: "12px" }}
                    className="font-mono"
                  >
                    {row.paymentId}
                  </span>
                </td>

                {/* Failure Code */}
                <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                  <code
                    style={{
                      fontSize: "11px",
                      padding: "2px 6px",
                      backgroundColor: "var(--rf-surface-subtle)",
                      border: "1px solid var(--rf-border)",
                      borderRadius: "3px",
                      color: "var(--rf-text-primary)",
                    }}
                    className="font-mono"
                  >
                    {row.failureCode}
                  </code>
                </td>

                {/* Provider */}
                <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: "12.5px", color: "var(--rf-navy-primary)" }}>
                    {row.provider}
                  </span>
                </td>

                {/* Amount (Right aligned) */}
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "var(--rf-navy-primary)",
                    whiteSpace: "nowrap",
                  }}
                  className="font-mono tabular-nums"
                >
                  {row.amount}
                </td>

                {/* Status Badge */}
                <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                  <Badge status={row.status} size="sm" />
                </td>

                {/* Attempts */}
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    color: "var(--rf-text-secondary)",
                    fontSize: "12px",
                  }}
                  className="font-mono tabular-nums"
                >
                  {row.attempts}
                </td>

                {/* Time */}
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    color: "var(--rf-text-muted)",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                  }}
                  className="font-mono"
                >
                  {row.time}
                </td>

                {/* Action */}
                <td style={{ padding: "12px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <a href={`/cases/${encodeURIComponent(row.caseId)}`} style={{ textDecoration: "none" }}>
                    <Button variant="ghost" size="sm">
                      Inspect
                    </Button>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .rf-table-row:hover {
          background-color: var(--rf-surface-subtle);
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
