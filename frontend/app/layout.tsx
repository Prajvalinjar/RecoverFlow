import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecoverFlow",
  description: "Autonomous Revenue Recovery System - Phase 0 Foundation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
