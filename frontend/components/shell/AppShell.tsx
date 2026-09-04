"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DesktopNav } from "./DesktopNav";
import { TopCommandBar } from "./TopCommandBar";
import { MobileNav } from "./MobileNav";
import { CommandSearchDialog } from "./CommandSearchDialog";
import { getNavStateFromPathname } from "./navConfig";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const navState = getNavStateFromPathname(pathname);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener for search command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--rf-canvas)",
        color: "var(--rf-text-primary)",
      }}
      className="rf-app-shell"
    >
      {/* Desktop Navigation Sidebar */}
      <div className="rf-desktop-nav-wrapper">
        <DesktopNav activeId={navState.activeId} />
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeId={navState.activeId}
      />

      {/* Command & Search Dialog */}
      <CommandSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          minHeight: "100vh",
        }}
      >
        <TopCommandBar
          currentSection={navState.currentSection}
          currentPage={navState.currentPage}
          isMobileNavOpen={isMobileNavOpen}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onSearchClick={() => setIsSearchOpen(true)}
        />

        <main
          style={{
            flex: 1,
            padding: "28px 32px 48px 32px",
            maxWidth: "1600px",
            width: "100%",
            margin: "0 auto",
          }}
          className="rf-main-content"
        >
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .rf-desktop-nav-wrapper {
            display: none !important;
          }
          .rf-main-content {
            padding: 20px 16px 36px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};
