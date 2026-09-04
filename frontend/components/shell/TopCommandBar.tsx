"use client";

import React from "react";
import { Search, Command, Menu } from "lucide-react";
import { Badge } from "../ui/Badge";
import { UserMenuDropdown } from "./UserMenuDropdown";

export interface TopCommandBarProps {
  currentSection?: string;
  currentPage?: string;
  isMobileNavOpen?: boolean;
  onOpenMobileNav?: () => void;
  onSearchClick?: () => void;
  className?: string;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  currentSection = "COMMAND",
  currentPage = "Overview",
  isMobileNavOpen = false,
  onOpenMobileNav,
  onSearchClick,
  className = "",
}) => {
  return (
    <header
      style={{
        height: "var(--rf-topbar-height)",
        backgroundColor: "var(--rf-surface)",
        borderBottom: "1px solid var(--rf-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
      className={`rf-topbar ${className}`}
    >
      {/* Left: RecoverFlow / Command + Current Page Context */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Mobile Nav Toggle */}
        <button
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          aria-expanded={isMobileNavOpen}
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            backgroundColor: "transparent",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-control)",
            color: "var(--rf-navy-primary)",
            cursor: "pointer",
          }}
          className="rf-mobile-menu-btn"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {/* Breadcrumb line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--rf-text-muted)",
            }}
          >
            <span>RecoverFlow</span>
            <span>/</span>
            <span style={{ color: "var(--rf-text-secondary)" }}>{currentSection}</span>
          </div>

          {/* Current Page Title */}
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--rf-navy-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {currentPage}
          </div>
        </div>
      </div>

      {/* Right: Operational Status, Sandbox Badge, Search, User Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* System Status Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          className="rf-header-badges"
        >
          <Badge status="OPERATIONAL" label="SYSTEM OPERATIONAL" size="sm" />
          <Badge status="SANDBOX" label="TEST / SANDBOX" dot={false} size="sm" />
        </div>

        {/* Global Search */}
        <button
          onClick={onSearchClick}
          aria-label="Open global search and command launcher"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            height: "36px",
            padding: "0 12px",
            backgroundColor: "var(--rf-canvas)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-control)",
            color: "var(--rf-text-muted)",
            cursor: "pointer",
            fontSize: "12.5px",
            transition: "border-color 120ms ease, background-color 120ms ease",
          }}
          className="rf-search-trigger"
        >
          <Search size={14} />
          <span style={{ color: "var(--rf-text-secondary)", fontWeight: 450 }}>
            Search cases, payments, events...
          </span>
          <kbd
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              padding: "2px 5px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--rf-border)",
              borderRadius: "3px",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--rf-text-muted)",
            }}
            className="font-mono"
          >
            <Command size={10} />K
          </kbd>
        </button>

        {/* User Identity Menu */}
        <UserMenuDropdown />
      </div>

      <style jsx>{`
        .rf-search-trigger:hover {
          border-color: #cbd5e1;
          background-color: #FFFFFF;
        }
        @media (max-width: 1024px) {
          .rf-mobile-menu-btn {
            display: flex !important;
          }
          .rf-header-badges {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .rf-search-trigger span,
          .rf-search-trigger kbd {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
