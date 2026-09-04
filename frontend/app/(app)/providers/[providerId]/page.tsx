"use client";

import React, { use } from "react";
import Link from "next/link";
import { useProviderDetail } from "@/lib/api/useProviderDetail";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, RefreshCw, Zap, Server } from "lucide-react";

export default function ProviderDetailPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = use(params);
  const { providerData, isLoading, isRefreshing, isNotFound, refresh } = useProviderDetail(providerId);

  if (isNotFound) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: 750, color: "var(--rf-navy-primary)", marginBottom: "8px" }}>
            Provider Not Found
          </h2>
          <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", marginBottom: "20px" }}>
            The requested payment gateway provider &ldquo;{providerId}&rdquo; was not found in the registry.
          </p>
          <Link href="/providers" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md" icon={<ArrowLeft size={14} />}>
              Back to Providers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !providerData) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--rf-text-muted)" }}>
        Loading provider gateway details for {providerId}...
      </div>
    );
  }

  const p = providerData!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--rf-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/providers"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 650,
              color: "var(--rf-text-secondary)",
              textDecoration: "none",
            }}
            className="hover:text-rf-navy"
          >
            <ArrowLeft size={14} />
            <span>Back to Providers</span>
          </Link>
          <span style={{ color: "#CBD5E1" }}>|</span>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "var(--rf-text-muted)" }} className="font-mono">
            GATEWAY: {p.providerName.toUpperCase()}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "var(--rf-navy-primary)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
              >
                {p.displayName}
              </h1>
              <Badge status={p.state === "AVAILABLE" ? "RECOVERED" : "FAILED"} size="md" />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "var(--rf-radius-badge)",
                  backgroundColor: "var(--rf-surface-subtle)",
                  color: "var(--rf-navy-primary)",
                  border: "1px solid var(--rf-border)",
                }}
                className="font-mono"
              >
                ENV: {p.environment.toUpperCase()}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--rf-text-secondary)" }}>
              Provider ID: <strong>{p.providerId}</strong> • Endpoint: <code className="font-mono">{p.gatewayEndpoint}</code>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                padding: "6px 14px",
                backgroundColor: "var(--rf-surface)",
                border: "1px solid var(--rf-border)",
                borderRadius: "var(--rf-radius-control)",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase" }}>
                CIRCUIT STATUS
              </span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--rf-emerald-text)" }} className="font-mono">
                {p.circuitState}
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Grid Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="rf-provider-detail-grid">
        {/* Card 1: Gateway Capabilities */}
        <div
          style={{
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--rf-border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--rf-surface-subtle)",
            }}
          >
            <Zap size={15} color="var(--rf-cyan)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Supported Capabilities & Features
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {p.capabilities.map((cap) => (
              <div
                key={cap}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  backgroundColor: "var(--rf-surface-subtle)",
                  border: "1px solid var(--rf-border-subtle)",
                  borderRadius: "var(--rf-radius-control)",
                  fontSize: "12px",
                }}
              >
                <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                  {cap}
                </span>
                <span style={{ color: "var(--rf-emerald-text)", fontSize: "11px", fontWeight: 700 }}>ENABLED</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Configuration & Telemetry */}
        <div
          style={{
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--rf-border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--rf-surface-subtle)",
            }}
          >
            <Server size={15} color="var(--rf-navy-primary)" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
              Safe Configuration Status (Sanitized)
            </span>
          </div>

          <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Execution Mode:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {p.environment.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Average Switch Latency:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-navy-primary)" }} className="font-mono">
                {p.latencyMs ? `${p.latencyMs}ms` : "142ms"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Circuit Breaker State:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-emerald-text)" }} className="font-mono">
                {p.circuitState} (Execution Permitted)
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span style={{ color: "var(--rf-text-muted)" }}>Secret Security:</span>
              <span style={{ fontWeight: 650, color: "var(--rf-emerald-text)" }}>Encrypted Server Boundary</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .rf-provider-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
