"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
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
  ArrowRight,
} from "lucide-react";
import { NAV_SECTIONS } from "./navConfig";

export interface CommandSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  overview: <LayoutDashboard size={16} />,
  cases: <FolderKanban size={16} />,
  payments: <CreditCard size={16} />,
  jobs: <Layers size={16} />,
  reconciliation: <GitCompare size={16} />,
  analytics: <BarChart3 size={16} />,
  flow: <Network size={16} />,
  providers: <Landmark size={16} />,
  workers: <Cpu size={16} />,
  health: <Activity size={16} />,
  audit: <FileText size={16} />,
  control: <Sliders size={16} />,
  settings: <Settings size={16} />,
};

export const CommandSearchDialog: React.FC<CommandSearchDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchId = useId();

  // Flatten all items for search & keyboard navigation
  const allItems = React.useMemo(() => {
    return NAV_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        section: section.title,
        icon: ICON_MAP[item.id] || <FileText size={16} />,
      }))
    );
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if (e.key === "Enter") {
        if (filteredItems[selectedIndex]) {
          e.preventDefault();
          router.push(filteredItems[selectedIndex].href);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, router]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command and Navigation Search"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px 16px 20px 16px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(7, 31, 46, 0.65)",
          backdropFilter: "blur(4px)",
          transition: "opacity 150ms ease",
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "580px",
          backgroundColor: "var(--rf-surface)",
          border: "1px solid var(--rf-border)",
          borderRadius: "var(--rf-radius-surface)",
          boxShadow: "0 20px 48px -12px rgba(6, 26, 43, 0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 201,
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            height: "52px",
            borderBottom: "1px solid var(--rf-border)",
            gap: "10px",
          }}
        >
          <Search size={18} style={{ color: "var(--rf-text-muted)" }} />
          <input
            id={searchId}
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search commands, modules, or navigate..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "var(--rf-text-primary)",
              backgroundColor: "transparent",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button
              onClick={() => handleQueryChange("")}
              aria-label="Clear search input"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--rf-text-muted)",
                display: "flex",
                alignItems: "center",
                padding: "2px",
              }}
            >
              <X size={16} />
            </button>
          )}
          <kbd
            style={{
              padding: "2px 6px",
              fontSize: "10px",
              fontWeight: 600,
              backgroundColor: "var(--rf-canvas)",
              border: "1px solid var(--rf-border)",
              borderRadius: "4px",
              color: "var(--rf-text-muted)",
            }}
            className="font-mono"
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          style={{
            maxHeight: "340px",
            overflowY: "auto",
            padding: "8px",
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--rf-text-secondary)",
                fontSize: "13px",
              }}
            >
              No matching modules or commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 12px",
                      borderRadius: "var(--rf-radius-control)",
                      backgroundColor: isSelected
                        ? "var(--rf-surface-blue-tint)"
                        : "transparent",
                      color: isSelected
                        ? "var(--rf-navy-primary)"
                        : "var(--rf-text-primary)",
                      textDecoration: "none",
                      fontSize: "13.5px",
                      fontWeight: isSelected ? 600 : 450,
                      transition: "background-color 80ms ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          color: isSelected
                            ? "var(--rf-cyan)"
                            : "var(--rf-text-secondary)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 650,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--rf-text-muted)",
                        }}
                      >
                        {item.section}
                      </span>
                      {isSelected && (
                        <ArrowRight size={13} style={{ color: "var(--rf-cyan)" }} />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--rf-border)",
            backgroundColor: "var(--rf-surface-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "var(--rf-text-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span><kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> Navigate</span>
            <span><kbd className="font-mono">↵</kbd> Select</span>
            <span><kbd className="font-mono">ESC</kbd> Close</span>
          </div>
          <span className="font-mono" style={{ fontSize: "10px" }}>
            SANDBOX REGISTRY
          </span>
        </div>
      </div>
    </div>
  );
};
