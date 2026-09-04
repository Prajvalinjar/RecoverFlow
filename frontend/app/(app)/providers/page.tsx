"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useProviders } from "@/lib/api/useProviders";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, RefreshCw, ArrowRight } from "lucide-react";

export default function ProvidersPage() {
  const { providers, summary, isLoading, isRefreshing, isLive, refresh } = useProviders();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const q = searchQuery.toLowerCase().trim();
    return providers.filter(
      (p) =>
        p.providerId.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        p.environment.toLowerCase().includes(q)
    );
  }, [providers, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%" }}>
      {/* 1. Page Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--rf-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--rf-text-muted)",
            textTransform: "uppercase",
          }}
        >
          <Link href="/dashboard" style={{ color: "var(--rf-text-muted)", textDecoration: "none" }}>
            RECOVERFLOW
          </Link>
          <span style={{ color: "#CBD5E1" }}>/</span>
          <span style={{ color: "var(--rf-text-secondary)" }}>OPERATIONS</span>
          <span style={{ color: "#CBD5E1" }}>/</span>
          <span style={{ color: "var(--rf-text-secondary)" }}>PROVIDERS</span>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h1
              style={{
                fontSize: "30px",
                fontWeight: 750,
                color: "var(--rf-navy-primary)",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Providers
            </h1>
            <p style={{ fontSize: "14px", color: "var(--rf-text-secondary)", lineHeight: 1.5 }}>
              Payment gateway availability, execution switch state, and circuit health.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 650,
                padding: "3px 8px",
                borderRadius: "var(--rf-radius-badge)",
                backgroundColor: isLive ? "var(--rf-emerald-surface)" : "var(--rf-canvas)",
                color: isLive ? "var(--rf-emerald-text)" : "var(--rf-text-muted)",
                border: `1px solid ${isLive ? "var(--rf-emerald-border)" : "var(--rf-border)"}`,
              }}
              className="font-mono"
            >
              {isLive ? "LIVE PROVIDER SWITCH" : "SANDBOX REPOSITORY"}
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={isRefreshing}
              icon={<RefreshCw size={12} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />}
            >
              {isRefreshing ? "Refreshing..." : "Sync Providers"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Summary Metric Strip */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            overflow: "hidden",
          }}
          className="rf-providers-summary-rail"
        >
          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              REGISTERED PROVIDERS
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-navy-primary)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.totalProviders}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-emerald-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              AVAILABLE & HEALTHY
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-emerald-text)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.availableCount}
            </div>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--rf-border)" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-warning)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              DEGRADED / MISCONFIGURED
            </span>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--rf-warning)", marginTop: "2px" }} className="font-mono tabular-nums">
              {summary.degradedCount}
            </div>
          </div>

          <div style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--rf-emerald-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              CIRCUIT BREAKER
            </span>
            <div style={{ fontSize: "18px", fontWeight: 750, color: "var(--rf-emerald-text)", marginTop: "4px" }} className="font-mono">
              {summary.circuitState} (Execution Permitted)
            </div>
          </div>
        </div>
      )}

      {/* 3. Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "0 10px",
            height: "36px",
            backgroundColor: "var(--rf-surface-subtle)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-control)",
            minWidth: "240px",
            flex: 1,
            maxWidth: "360px",
          }}
        >
          <Search size={15} color="var(--rf-text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Provider..."
            style={{
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              fontSize: "13px",
              color: "var(--rf-text-primary)",
              width: "100%",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* 4. Providers Table */}
      <div
        style={{
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "860px",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "var(--rf-surface-subtle)", borderBottom: "1px solid var(--rf-border)" }}>
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "20%" }}>
                  PROVIDER
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "14%" }}>
                  ENVIRONMENT
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "14%" }}>
                  STATUS
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "18%" }}>
                  GATEWAY ENDPOINT
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", width: "12%" }}>
                  CIRCUIT
                </th>
                <th style={{ padding: "11px 12px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "10%" }}>
                  LATENCY
                </th>
                <th style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--rf-text-secondary)", textAlign: "right", width: "12%" }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    Loading provider gateways...
                  </td>
                </tr>
              ) : filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "var(--rf-text-muted)" }}>
                    No providers found.
                  </td>
                </tr>
              ) : (
                filteredProviders.map((p, idx) => (
                  <tr
                    key={p.providerId}
                    style={{
                      borderBottom: idx === filteredProviders.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
                      transition: "background-color 100ms ease",
                    }}
                    className="rf-table-row"
                  >
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/providers/${encodeURIComponent(p.providerId)}`}
                        style={{ fontWeight: 700, color: "var(--rf-navy-primary)", textDecoration: "none" }}
                        className="hover:underline"
                      >
                        {p.displayName}
                      </Link>
                      <div style={{ fontSize: "11px", color: "var(--rf-text-muted)" }} className="font-mono">
                        {p.providerName}
                      </div>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 650,
                          padding: "2px 6px",
                          borderRadius: "3px",
                          backgroundColor: "var(--rf-surface-subtle)",
                          border: "1px solid var(--rf-border)",
                          color: "var(--rf-navy-primary)",
                          textTransform: "uppercase",
                        }}
                        className="font-mono"
                      >
                        {p.environment}
                      </span>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <Badge status={p.state === "AVAILABLE" ? "RECOVERED" : "FAILED"} size="sm" />
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "11.5px", color: "var(--rf-text-secondary)" }} className="font-mono">
                        {p.gatewayEndpoint}
                      </span>
                    </td>

                    <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--rf-emerald-text)" }} className="font-mono">
                        {p.circuitState}
                      </span>
                    </td>

                    <td style={{ padding: "11px 12px", textAlign: "right", whiteSpace: "nowrap" }} className="font-mono">
                      {p.latencyMs ? `${p.latencyMs}ms` : "—"}
                    </td>

                    <td style={{ padding: "11px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link href={`/providers/${encodeURIComponent(p.providerId)}`} style={{ textDecoration: "none" }}>
                        <Button variant="ghost" size="sm" icon={<ArrowRight size={12} />}>
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .rf-table-row:hover {
          background-color: var(--rf-surface-subtle);
        }
        @media (max-width: 1024px) {
          .rf-providers-summary-rail {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .rf-providers-summary-rail {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
