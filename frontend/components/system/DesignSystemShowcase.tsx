"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  RefreshCw,
  Search,
  Sliders,
  Terminal,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { AnalyticalRail, SectionSurface, TelemetryRail } from "../ui/Surface";
import { DataTable } from "../ui/DataTable";
import { ChartFrame } from "../ui/ChartFrame";

export const DesignSystemShowcase: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");

  // Sample data for Data Table Foundation demonstration
  const sampleTableData = [
    {
      caseId: "CASE-2026-8941",
      paymentId: "pay_N8k1x90Lm",
      customer: "Acme Corp Enterprise",
      amount: "$12,450.00",
      failureCode: "BANK_TIMEOUT",
      status: "RECOVERED",
      strategy: "SMART_RETRY_FALLBACK",
      timestamp: "2026-08-25 17:42:19",
    },
    {
      caseId: "CASE-2026-8942",
      paymentId: "pay_K2a90pZ1v",
      customer: "Starlight Media LLC",
      amount: "$3,890.00",
      failureCode: "INSUFFICIENT_FUNDS",
      status: "ACTIVE",
      strategy: "DYNAMIC_PAYMENT_LINK",
      timestamp: "2026-08-25 17:48:02",
    },
    {
      caseId: "CASE-2026-8943",
      paymentId: "pay_B4v81mP9x",
      customer: "FinScale Technologies",
      amount: "$28,100.00",
      failureCode: "CARD_AUTHENTICATION_FAILED",
      status: "MANUAL_REVIEW",
      strategy: "AI_RECOVERY_AGENT",
      timestamp: "2026-08-25 17:51:30",
    },
    {
      caseId: "CASE-2026-8944",
      paymentId: "pay_Q7r52wL3n",
      customer: "Nexus Infrastructure",
      amount: "$940.00",
      failureCode: "GATEWAY_DOWN",
      status: "QUEUED",
      strategy: "DELAYED_IDEMPOTENT_RETRY",
      timestamp: "2026-08-25 17:53:11",
    },
    {
      caseId: "CASE-2026-8945",
      paymentId: "pay_X9p34tV6b",
      customer: "HyperGrowth SaaS",
      amount: "$6,220.00",
      failureCode: "INVALID_ACCOUNT_STATE",
      status: "FAILED",
      strategy: "TERMINAL_POLICY_CHECK",
      timestamp: "2026-08-25 17:54:45",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Editorial Header Section */}
      <div
        style={{
          borderBottom: "1px solid var(--rf-border)",
          paddingBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge status="OPERATIONAL" label="FOUNDATION READY" size="sm" />
          <span style={{ fontSize: "12px", color: "var(--rf-text-muted)" }}>
            Phase 1 • Visual System & Application Shell
          </span>
        </div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "var(--rf-navy-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          RecoverFlow Visual Foundation & Application Shell
        </h1>
        <p
          style={{
            fontSize: "14.5px",
            color: "var(--rf-text-secondary)",
            maxWidth: "920px",
            lineHeight: 1.6,
          }}
        >
          Engineered as a high-integrity revenue recovery control system. Built with restrained
          editorial typography, analytical surfaces, strict fintech color discipline, and zero
          generic dashboard clutter.
        </p>
      </div>

      {/* Telemetry Rail Foundation */}
      <div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 650,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--rf-navy-primary)",
            marginBottom: "10px",
          }}
        >
          1. High-Density Telemetry Rail Surface
        </div>
        <TelemetryRail
          items={[
            {
              label: "Recovery Rate (30D)",
              value: "74.82%",
              subtext: "+12.4% vs baseline retry",
              status: "emerald",
            },
            {
              label: "Active Recovered Volume",
              value: "$2,841,920.00",
              subtext: "1,492 recovered transactions",
              status: "emerald",
            },
            {
              label: "Pipeline In-Flight",
              value: "$384,100.00",
              subtext: "142 queued / running cases",
              status: "cyan",
            },
            {
              label: "Active Workers & Pool",
              value: "8 / 8 ONLINE",
              subtext: "avg lease 420ms · 0 starved",
              code: true,
              status: "emerald",
            },
            {
              label: "Circuit Breaker",
              value: "CLOSED (HEALTHY)",
              subtext: "razorpay-primary provider",
              code: true,
              status: "emerald",
            },
          ]}
        />
      </div>

      {/* Semantic Color Tokens & Brand System */}
      <SectionSurface
        title="2. Brand Visual Tokens & Color Discipline"
        subtitle="Restrained off-white canvas, deep infrastructure navy, light-blue analytical zones, and semantic financial signals."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            {
              name: "Canvas",
              hex: "#F7F9F8",
              desc: "Primary application background",
              bg: "#F7F9F8",
              border: "#DCE7EC",
              text: "#102A43",
            },
            {
              name: "Pure Surface",
              hex: "#FFFFFF",
              desc: "Analytical tables, workspaces, topbar",
              bg: "#FFFFFF",
              border: "#DCE7EC",
              text: "#102A43",
            },
            {
              name: "Deep Infrastructure Navy",
              hex: "#071F2E",
              desc: "Desktop navigation & core identity",
              bg: "#071F2E",
              border: "#071F2E",
              text: "#FFFFFF",
            },
            {
              name: "Light Blue Analytical",
              hex: "#EEF7FB",
              desc: "Analytical sections & telemetry zones",
              bg: "#EEF7FB",
              border: "#DDF1FA",
              text: "#102A43",
            },
            {
              name: "Emerald Financial",
              hex: "#00A878",
              desc: "Recovered transactions & primary actions",
              bg: "rgba(0, 168, 120, 0.08)",
              border: "rgba(0, 168, 120, 0.3)",
              text: "#00825B",
            },
            {
              name: "Cyan Operational",
              hex: "#1597D3",
              desc: "Active jobs, in-flight systems & signals",
              bg: "rgba(21, 151, 211, 0.08)",
              border: "rgba(21, 151, 211, 0.3)",
              text: "#0F7CAE",
            },
            {
              name: "AI Advisory Violet",
              hex: "#7957D5",
              desc: "Reserved strictly for AI agent suggestions",
              bg: "rgba(121, 87, 213, 0.08)",
              border: "rgba(121, 87, 213, 0.3)",
              text: "#6343BF",
            },
            {
              name: "Operational Severity",
              hex: "#E5484D / #F59E0B",
              desc: "Real failure states & manual review alerts",
              bg: "rgba(229, 72, 77, 0.08)",
              border: "rgba(229, 72, 77, 0.3)",
              text: "#CE2C31",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: item.bg,
                border: `1px solid ${item.border}`,
                borderRadius: "var(--rf-radius-control)",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 700, color: item.text }}>
                {item.name}
              </span>
              <span
                style={{ fontSize: "11px", color: item.text, opacity: 0.85 }}
                className="font-mono"
              >
                {item.hex}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: item.text,
                  opacity: 0.75,
                  marginTop: "4px",
                  lineHeight: 1.3,
                }}
              >
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </SectionSurface>

      {/* Semantic Status Badge System */}
      <SectionSurface
        title="3. Semantic Status Badge System"
        subtitle="Compact 4px radius badges with strict semantic alignment across lifecycle states."
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <Badge status="RECOVERED" />
          <Badge status="ACTIVE" />
          <Badge status="QUEUED" />
          <Badge status="FAILED" />
          <Badge status="ESCALATED" />
          <Badge status="MANUAL REVIEW" />
          <Badge status="CLOSED" />
          <Badge status="HALF OPEN" />
          <Badge status="OPERATIONAL" />
          <Badge status="AI ADVISORY" icon={<Sparkles size={11} />} />
          <Badge status="SANDBOX" dot={false} />
        </div>
      </SectionSurface>

      {/* Button Controls & Form Inputs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Buttons */}
        <SectionSurface
          title="4. Precision Button Controls"
          subtitle="Real fintech product controls with 6px radius and restrained hover states."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <Button variant="primary" icon={<ArrowUpRight size={15} />}>
                Execute Recovery
              </Button>
              <Button variant="secondary" icon={<RefreshCw size={14} />}>
                Re-evaluate Policy
              </Button>
              <Button variant="ghost" icon={<Sliders size={14} />}>
                Configure Rules
              </Button>
              <Button variant="danger">Kill Worker</Button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <Button variant="primary" size="sm">
                Small Action
              </Button>
              <Button variant="secondary" size="sm">
                Filter Cases
              </Button>
              <Button variant="primary" size="md" loading>
                Dispatching Job
              </Button>
              <Button variant="secondary" size="md" disabled>
                Disabled State
              </Button>
            </div>
          </div>
        </SectionSurface>

        {/* Inputs */}
        <SectionSurface
          title="5. Form & Search Controls"
          subtitle="White surface, 1px border, 6px radius, and subtle focus states."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Input
              label="Case Search / Filter"
              placeholder="Filter by case_id, customer, or payment hash..."
              icon={<Search size={15} />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              hint="Press ⌘K anytime to open global command launcher."
            />
            <Input
              label="Provider Webhook Endpoint"
              defaultValue="https://api.recoverflow.io/v1/events/payment-failure"
              icon={<Terminal size={14} />}
              readOnly
              style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "12.5px" }}
            />
          </div>
        </SectionSurface>
      </div>

      {/* Analytical Layout: Chart Workspace + Analytical Rail */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
        }}
        className="rf-analytics-grid"
      >
        {/* Chart Workspace Foundation */}
        <ChartFrame
          title="Recovery Velocity & Volume Curve"
          subtitle="Autonomous vs Manual Interventions (30 Days)"
          metric="$2,841,920.00"
          metricLabel="recovered across 1,492 attempts (74.8% success)"
          legends={[
            { label: "Autonomous Recoveries", color: "var(--rf-emerald)", value: "$2.41M" },
            { label: "Active Retries", color: "var(--rf-cyan)", value: "$384K" },
            { label: "Terminal Failures", color: "var(--rf-danger)", value: "$96K" },
          ]}
          height="220px"
        >
          {/* Visual Chart Foundation Representation */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            {/* Horizontal Grid lines */}
            {[100, 75, 50, 25, 0].map((level, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--rf-text-muted)",
                    width: "36px",
                    textAlign: "right",
                  }}
                  className="font-mono"
                >
                  ${level}k
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    backgroundColor: "var(--rf-border-subtle)",
                  }}
                />
              </div>
            ))}

            {/* Stylized Analytical Trendline */}
            <svg
              style={{
                position: "absolute",
                left: "48px",
                right: "0px",
                top: "10px",
                bottom: "24px",
                width: "calc(100% - 48px)",
                height: "calc(100% - 34px)",
                overflow: "visible",
              }}
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
            >
              {/* Cyan Active Volume Area */}
              <path
                d="M 0,120 Q 80,100 150,110 T 300,70 T 420,50 T 500,30 L 500,150 L 0,150 Z"
                fill="rgba(21, 151, 211, 0.05)"
              />
              <path
                d="M 0,120 Q 80,100 150,110 T 300,70 T 420,50 T 500,30"
                fill="none"
                stroke="var(--rf-cyan)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Emerald Recovered Curve */}
              <path
                d="M 0,140 Q 90,120 160,85 T 320,50 T 440,25 T 500,10 L 500,150 L 0,150 Z"
                fill="rgba(0, 168, 120, 0.06)"
              />
              <path
                d="M 0,140 Q 90,120 160,85 T 320,50 T 440,25 T 500,10"
                fill="none"
                stroke="var(--rf-emerald)"
                strokeWidth="2.5"
              />
            </svg>

            {/* X-Axis labels */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingLeft: "48px",
                fontSize: "11px",
                color: "var(--rf-text-muted)",
              }}
              className="font-mono"
            >
              <span>Aug 01</span>
              <span>Aug 07</span>
              <span>Aug 14</span>
              <span>Aug 21</span>
              <span>Aug 25 (Today)</span>
            </div>
          </div>
        </ChartFrame>

        {/* Analytical Rail */}
        <AnalyticalRail
          title="Telemetry & Signals"
          badge={<Badge status="OPERATIONAL" label="HEALTHY" size="sm" />}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--rf-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Active Provider Gateway
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 650,
                    color: "var(--rf-navy-primary)",
                  }}
                >
                  Razorpay Gateway Connect
                </span>
                <Badge status="ACTIVE" label="99.98% UP" size="sm" dot={false} />
              </div>
            </div>

            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "var(--rf-surface-light-blue)",
                border: "1px solid var(--rf-border)",
                borderRadius: "var(--rf-radius-control)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={13} color="var(--rf-violet)" />
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 650,
                    color: "var(--rf-violet-text)",
                  }}
                >
                  AI Agent Advisory Signal
                </span>
              </div>
              <p
                style={{
                  fontSize: "11.5px",
                  color: "var(--rf-text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                Bank timeout rates spiking on HDFC netbanking (+4.2%). Dynamic payment link
                fallback recommended.
              </p>
            </div>

            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--rf-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Queue Scheduling Policy
              </span>
              <div style={{ marginTop: "4px" }}>
                <code
                  style={{
                    fontSize: "11.5px",
                    backgroundColor: "var(--rf-surface-subtle)",
                    padding: "3px 6px",
                    borderRadius: "3px",
                    border: "1px solid var(--rf-border)",
                    color: "var(--rf-navy-primary)",
                    display: "block",
                  }}
                  className="font-mono"
                >
                  anti_starvation_boost = age_sec * 0.1
                </code>
              </div>
            </div>
          </div>
        </AnalyticalRail>
      </div>

      {/* Data Table Foundation */}
      <SectionSurface
        title="6. Data Table Foundation & Monospace Identifiers"
        subtitle="Dense tabular presentation with JetBrains Mono identifiers, status indicators, and clean dividers."
        headerAction={
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />}>
            Refresh Ingestion
          </Button>
        }
      >
        <DataTable
          keyField="caseId"
          columns={[
            {
              key: "caseId",
              header: "Case ID",
              isMono: true,
              width: "170px",
              render: (row) => (
                <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }}>
                  {row.caseId}
                </span>
              ),
            },
            {
              key: "paymentId",
              header: "Payment Reference",
              isMono: true,
              width: "160px",
              render: (row) => (
                <span style={{ color: "var(--rf-text-secondary)" }}>{row.paymentId}</span>
              ),
            },
            {
              key: "customer",
              header: "Customer Account",
              render: (row) => (
                <span style={{ fontWeight: 550, color: "var(--rf-navy-primary)" }}>
                  {row.customer}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              width: "130px",
              render: (row) => (
                <span
                  style={{
                    fontWeight: 700,
                    color: "var(--rf-navy-primary)",
                  }}
                  className="tabular-nums font-mono"
                >
                  {row.amount}
                </span>
              ),
            },
            {
              key: "failureCode",
              header: "Failure Code",
              isMono: true,
              render: (row) => (
                <code
                  style={{
                    fontSize: "11px",
                    padding: "2px 5px",
                    backgroundColor: "var(--rf-surface-subtle)",
                    border: "1px solid var(--rf-border)",
                    borderRadius: "3px",
                    color: "var(--rf-text-secondary)",
                  }}
                >
                  {row.failureCode}
                </code>
              ),
            },
            {
              key: "status",
              header: "Status",
              width: "150px",
              render: (row) => <Badge status={row.status} size="sm" />,
            },
            {
              key: "timestamp",
              header: "Event Time",
              isMono: true,
              align: "right",
              render: (row) => (
                <span style={{ fontSize: "12px", color: "var(--rf-text-muted)" }}>
                  {row.timestamp}
                </span>
              ),
            },
          ]}
          data={sampleTableData}
        />
      </SectionSurface>

      <style jsx>{`
        @media (max-width: 1024px) {
          .rf-analytics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
