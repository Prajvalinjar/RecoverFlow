"use client";

import React from "react";
import Image from "next/image";

export interface RecoverFlowLogoProps {
  size?: number;
  className?: string;
  variant?: "color" | "inverted" | "monochrome";
  style?: React.CSSProperties;
  priority?: boolean;
}

/**
 * RecoverFlow Official Master Brand Mark
 * Single source of truth canonical logo:
 * - Navy/dark background
 * - Cyan/blue outer glow/border appearance
 * - Green/teal recovery flow
 * - White central payment/recovery shape
 * - Dark arrow
 * - Green success checkmark
 * - Squircle composition
 */
export const RecoverFlowLogo: React.FC<RecoverFlowLogoProps> = ({
  size = 32,
  className = "",
  style,
  priority = true,
}) => {
  const radius = Math.round(size * 0.22);

  return (
    <Image
      src="/brand/recoverflow-logo.png"
      alt="RecoverFlow logo"
      width={size}
      height={size}
      priority={priority}
      className={`rf-brand-mark ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${radius}px`,
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
        ...style,
      }}
    />
  );
};


