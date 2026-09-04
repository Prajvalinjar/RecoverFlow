"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  CreditCard,
  Layers,
  GitCompare,
  BarChart3,
  Network,
  Landmark,
  Cpu,
  Activity,
  FileText,
  Sliders,
  Settings,
} from "lucide-react";
import { RecoverFlowLogo } from "../ui/RecoverFlowLogo";
import { NAV_SECTIONS, NavItemConfig, NavSectionConfig } from "./navConfig";

export const ICON_MAP: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard size={15} />,
  cases: <FolderKanban size={15} />,
  payments: <CreditCard size={15} />,
  jobs: <Layers size={15} />,
  reconciliation: <GitCompare size={15} />,
  analytics: <BarChart3 size={15} />,
  flow: <Network size={15} />,
  providers: <Landmark size={15} />,
  workers: <Cpu size={15} />,
  health: <Activity size={15} />,
  audit: <FileText size={15} />,
  control: <Sliders size={15} />,
  settings: <Settings size={15} />,
};

export interface DesktopNavProps {
  activeId: string;
  className?: string;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({
  activeId,
  className = "",
}) => {
  return (
    <nav
      aria-label="Sidebar Navigation"
      style={{
        width: "var(--rf-sidebar-width)",
        backgroundColor: "var(--rf-navy-sidebar)",
        borderRight: "1px solid var(--rf-navy-border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        zIndex: 40,
        userSelect: "none",
      }}
      className={`rf-desktop-nav ${className}`}
    >
      {/* Top-Left Header Branding Area - Exact 72px */}
      <div
        style={{
          height: "var(--rf-topbar-height)",
          padding: "0 22px",
          borderBottom: "1px solid var(--rf-navy-border)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Official RecoverFlow Logo Mark */}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
          aria-label="RecoverFlow Home"
        >
          <RecoverFlowLogo size={32} variant="inverted" />

          {/* Brand Name & Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 750,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              Recover<span style={{ color: "#00D28D" }}>Flow</span>
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "8.5px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--rf-text-inverse-muted)",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                REVENUE RECOVERY
              </span>
              <span
                style={{
                  fontSize: "8.5px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "#64748B",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                CONTROL SYSTEM
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 0",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {NAV_SECTIONS.map((section: NavSectionConfig) => (
          <div key={section.title} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div
              style={{
                padding: "0 20px 6px 20px",
                fontSize: "10.5px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#5B738A",
                textTransform: "uppercase",
              }}
            >
              {section.title}
            </div>

            {section.items.map((item: NavItemConfig) => {
              const isActive = activeId === item.id;
              const icon = ICON_MAP[item.id] || <FileText size={15} />;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "38px",
                    padding: "0 20px",
                    backgroundColor: isActive ? "var(--rf-navy-nav-active)" : "transparent",
                    color: isActive ? "#FFFFFF" : "var(--rf-text-inverse-muted)",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    textDecoration: "none",
                    transition: "all 120ms ease",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 450,
                  }}
                  className="rf-nav-item"
                >
                  {/* Active Left 2px Emerald Indicator */}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "2px",
                        backgroundColor: "var(--rf-emerald)",
                      }}
                    />
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        color: isActive ? "var(--rf-emerald)" : "#6E879C",
                        transition: "color 120ms ease",
                      }}
                    >
                      {icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        padding: "1px 6px",
                        fontSize: "10px",
                        fontWeight: 650,
                        borderRadius: "3px",
                        backgroundColor: isActive
                          ? "rgba(0, 168, 120, 0.2)"
                          : "rgba(255, 255, 255, 0.08)",
                        color: isActive ? "var(--rf-emerald)" : "#9BB2C4",
                      }}
                      className="tabular-nums"
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Telemetry & Status Area */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--rf-navy-border)",
          backgroundColor: "#051824",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--rf-emerald)",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 650,
                letterSpacing: "0.06em",
                color: "#E2F0EA",
                textTransform: "uppercase",
              }}
            >
              SYSTEM OPERATIONAL
            </span>
          </div>

          <span
            style={{
              padding: "1px 5px",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              borderRadius: "3px",
              backgroundColor: "rgba(21, 151, 211, 0.15)",
              color: "#38BDF8",
              border: "1px solid rgba(21, 151, 211, 0.3)",
            }}
          >
            TEST / SANDBOX
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "6px",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#FFFFFF" }}>
              Ops Admin
            </span>
            <span style={{ fontSize: "10px", color: "#6A8499" }} className="font-mono">
              admin@recoverflow.io
            </span>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: "#6A8499",
              letterSpacing: "0.02em",
            }}
            className="font-mono"
          >
            v2.4.0
          </span>
        </div>
      </div>

      <style jsx>{`
        .rf-nav-item:hover {
          background-color: var(--rf-navy-nav-hover) !important;
          color: #FFFFFF !important;
        }
        .rf-nav-item:hover span:first-child {
          color: #A4BACB !important;
        }
      `}</style>
    </nav>
  );
};
