"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings, FileText, Sliders, Shield, ChevronDown } from "lucide-react";

export const UserMenuDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User identity and profile menu"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "4px 8px 4px 10px",
          border: "none",
          borderLeft: "1px solid var(--rf-border)",
          backgroundColor: "transparent",
          cursor: "pointer",
          borderRadius: "var(--rf-radius-control)",
          textAlign: "left",
          transition: "background-color 120ms ease",
        }}
        className="rf-user-meta-btn"
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "var(--rf-radius-control)",
            backgroundColor: "var(--rf-surface-blue-tint)",
            border: "1px solid var(--rf-cyan-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--rf-cyan-text)",
            fontWeight: 700,
            fontSize: "11.5px",
            flexShrink: 0,
          }}
        >
          PO
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
          className="rf-user-text"
        >
          <span
            style={{
              fontSize: "12.5px",
              fontWeight: 650,
              color: "var(--rf-navy-primary)",
              lineHeight: 1.2,
            }}
          >
            Prajval O.
          </span>
          <span
            style={{
              fontSize: "10.5px",
              color: "var(--rf-text-muted)",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Ops Admin
          </span>
        </div>
        <ChevronDown
          size={13}
          style={{
            color: "var(--rf-text-muted)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
          }}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "240px",
            backgroundColor: "var(--rf-surface)",
            border: "1px solid var(--rf-border)",
            borderRadius: "var(--rf-radius-surface)",
            boxShadow: "0 12px 32px -8px rgba(6, 26, 43, 0.22)",
            zIndex: 150,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "rf-menu-appear 120ms ease-out",
          }}
        >
          {/* Identity Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--rf-border)",
              backgroundColor: "var(--rf-surface-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "var(--rf-radius-control)",
                  backgroundColor: "var(--rf-surface-blue-tint)",
                  border: "1px solid var(--rf-cyan-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--rf-cyan-text)",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                PO
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--rf-navy-primary)",
                  }}
                >
                  Prajval O.
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--rf-text-muted)",
                  }}
                  className="font-mono"
                >
                  admin@recoverflow.io
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 8px",
                backgroundColor: "var(--rf-surface-light-blue)",
                borderRadius: "var(--rf-radius-control)",
                fontSize: "10.5px",
              }}
            >
              <span style={{ color: "var(--rf-text-secondary)", fontWeight: 600 }}>
                Role: OPS ADMIN
              </span>
              <span
                style={{
                  color: "var(--rf-cyan-text)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                SANDBOX
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: "6px" }}>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                fontSize: "12.5px",
                color: "var(--rf-text-primary)",
                textDecoration: "none",
                borderRadius: "var(--rf-radius-control)",
                transition: "background-color 80ms ease",
              }}
              className="rf-user-menu-item"
            >
              <Settings size={15} style={{ color: "var(--rf-text-secondary)" }} />
              <span>System Settings</span>
            </Link>

            <Link
              href="/audit"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                fontSize: "12.5px",
                color: "var(--rf-text-primary)",
                textDecoration: "none",
                borderRadius: "var(--rf-radius-control)",
                transition: "background-color 80ms ease",
              }}
              className="rf-user-menu-item"
            >
              <FileText size={15} style={{ color: "var(--rf-text-secondary)" }} />
              <span>Audit Trail</span>
            </Link>

            <Link
              href="/operations"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                fontSize: "12.5px",
                color: "var(--rf-text-primary)",
                textDecoration: "none",
                borderRadius: "var(--rf-radius-control)",
                transition: "background-color 80ms ease",
              }}
              className="rf-user-menu-item"
            >
              <Sliders size={15} style={{ color: "var(--rf-text-secondary)" }} />
              <span>Operations Control</span>
            </Link>
          </div>

          {/* Session Footer */}
          <div
            style={{
              padding: "8px 16px",
              borderTop: "1px solid var(--rf-border)",
              backgroundColor: "var(--rf-surface-subtle)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "10.5px",
              color: "var(--rf-text-muted)",
            }}
          >
            <Shield size={12} style={{ color: "var(--rf-emerald)" }} />
            <span>Authenticated Session Active</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .rf-user-meta-btn:hover {
          background-color: var(--rf-canvas);
        }
        .rf-user-menu-item:hover {
          background-color: var(--rf-surface-blue-tint);
          color: var(--rf-navy-primary);
        }
        @media (max-width: 768px) {
          .rf-user-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
