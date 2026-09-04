"use client";

import React from "react";
import Link from "next/link";
import { AnalyticsProviderTelemetry } from "@/lib/types/analytics";
import { ArrowUpRight, Zap, Shield, Cpu } from "lucide-react";

export interface ProviderPerformanceProps {
  providers: AnalyticsProviderTelemetry[];
}

export const ProviderPerformance: React.FC<ProviderPerformanceProps> = ({ providers }) => {
  return (
    <div
      style={{
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
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
              Provider Efficiency & Health
            </h2>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: "var(--rf-cyan-text)",
                backgroundColor: "var(--rf-cyan-surface)",
                border: "1px solid var(--rf-cyan-border)",
                padding: "2px 6px",
                borderRadius: "var(--rf-radius-badge)",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              CURRENT PROVIDER STATE
            </span>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--rf-text-secondary)", marginTop: "2px" }}>
            Live execution telemetry, round-trip latency, and autonomous circuit breaker state.
          </p>
        </div>

        <Link
          href="/providers"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: 650,
            color: "var(--rf-cyan-text)",
            textDecoration: "none",
          }}
        >
          <span>All Providers</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Provider Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {providers.map((p) => {
          const isHealthy = p.state === "AVAILABLE" && p.circuitState === "CLOSED";

          return (
            <div
              key={p.providerId}
              style={{
                borderRadius: "var(--rf-radius-control)",
                border: "1px solid var(--rf-border-subtle)",
                backgroundColor: "var(--rf-surface-subtle)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--rf-navy-primary)" }}>
                      {p.displayName}
                    </span>
                    {p.isPrimary && (
                      <span
                        style={{
                          fontSize: "9.5px",
                          fontWeight: 700,
                          backgroundColor: "var(--rf-navy-primary)",
                          color: "#FFFFFF",
                          padding: "1px 5px",
                          borderRadius: "2px",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}
                      >
                        PRIMARY
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--rf-text-muted)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    ENV: {p.environment.toUpperCase()}
                  </span>
                </div>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    backgroundColor: isHealthy ? "var(--rf-emerald-surface)" : "var(--rf-warning-surface)",
                    color: isHealthy ? "var(--rf-emerald-text)" : "var(--rf-warning-text)",
                    border: `1px solid ${isHealthy ? "var(--rf-emerald-border)" : "var(--rf-warning-border)"}`,
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: isHealthy ? "var(--rf-emerald)" : "var(--rf-warning)",
                    }}
                  />
                  {p.state}
                </span>
              </div>

              {/* Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  padding: "10px",
                  backgroundColor: "var(--rf-surface)",
                  borderRadius: "4px",
                  border: "1px solid var(--rf-border-subtle)",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "10.5px",
                      color: "var(--rf-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Zap size={11} />
                    Latency
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 750,
                      color: "var(--rf-navy-primary)",
                    }}
                    className="font-mono tabular-nums"
                  >
                    {p.latencyMs} ms
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "10.5px",
                      color: "var(--rf-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Shield size={11} />
                    Circuit
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 750,
                      color: p.circuitState === "CLOSED" ? "var(--rf-emerald-text)" : "var(--rf-danger-text)",
                    }}
                    className="font-mono"
                  >
                    {p.circuitState}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Cpu size={12} color="var(--rf-text-muted)" />
                  {p.capabilitiesCount} Active Capabilities
                </span>

                <Link
                  href={`/providers/${p.providerId}`}
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 650,
                    color: "var(--rf-cyan-text)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <span>Inspect Provider</span>
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
