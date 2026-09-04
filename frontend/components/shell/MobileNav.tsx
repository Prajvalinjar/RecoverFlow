"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, FileText } from "lucide-react";
import { RecoverFlowLogo } from "../ui/RecoverFlowLogo";
import { NAV_SECTIONS, NavSectionConfig, NavItemConfig } from "./navConfig";
import { ICON_MAP } from "./DesktopNav";

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeId: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  activeId,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Drawer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(7, 31, 46, 0.65)",
          backdropFilter: "blur(3px)",
          transition: "opacity 200ms ease",
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "relative",
          width: "280px",
          maxWidth: "85vw",
          height: "100%",
          backgroundColor: "var(--rf-navy-sidebar)",
          borderRight: "1px solid var(--rf-navy-border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 101,
          boxShadow: "4px 0 24px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--rf-navy-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/dashboard"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <RecoverFlowLogo size={28} variant="inverted" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "15px", fontWeight: 750, color: "#FFFFFF" }}>
                Recover<span style={{ color: "#00D28D" }}>Flow</span>
              </span>
              <span
                style={{
                  fontSize: "8px",
                  fontWeight: 700,
                  color: "var(--rf-text-inverse-muted)",
                  letterSpacing: "0.06em",
                }}
              >
                REVENUE RECOVERY
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            aria-label="Close navigation drawer"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--rf-text-inverse-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation list */}
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
                  letterSpacing: "0.07em",
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
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      height: "40px",
                      padding: "0 20px",
                      backgroundColor: isActive ? "var(--rf-navy-nav-active)" : "transparent",
                      color: isActive ? "#FFFFFF" : "var(--rf-text-inverse-muted)",
                      textDecoration: "none",
                      fontSize: "13.5px",
                      fontWeight: isActive ? 600 : 450,
                      transition: "all 120ms ease",
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: "3px",
                          backgroundColor: "var(--rf-emerald)",
                        }}
                      />
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ color: isActive ? "var(--rf-emerald)" : "#6E879C" }}>
                        {icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        style={{
                          padding: "1px 6px",
                          fontSize: "10.5px",
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

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--rf-navy-border)",
            backgroundColor: "#051824",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "var(--rf-emerald)",
              }}
            />
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 650,
                color: "#E2F0EA",
                textTransform: "uppercase",
              }}
            >
              OPERATIONAL
            </span>
          </div>
          <span style={{ fontSize: "10.5px", color: "#6A8499" }} className="font-mono">
            SANDBOX
          </span>
        </div>
      </div>
    </div>
  );
};
