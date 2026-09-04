"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: 550,
    fontSize: size === "sm" ? "12px" : size === "lg" ? "15px" : "13.5px",
    borderRadius: "var(--rf-radius-control)",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "all 120ms ease-in-out",
    border: "1px solid transparent",
    whiteSpace: "nowrap",
    textDecoration: "none",
    userSelect: "none",
    letterSpacing: "-0.01em",
  };

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { height: "32px", padding: "0 12px" },
    md: { height: "38px", padding: "0 16px" },
    lg: { height: "42px", padding: "0 20px" },
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--rf-emerald)",
      color: "#FFFFFF",
      borderColor: "var(--rf-emerald)",
      opacity: disabled || loading ? 0.6 : 1,
    },
    secondary: {
      backgroundColor: "var(--rf-surface)",
      color: "var(--rf-navy-primary)",
      borderColor: "var(--rf-border)",
      opacity: disabled || loading ? 0.6 : 1,
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--rf-navy-primary)",
      borderColor: "transparent",
      opacity: disabled || loading ? 0.6 : 1,
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--rf-text-primary)",
      borderColor: "var(--rf-border)",
      opacity: disabled || loading ? 0.6 : 1,
    },
    danger: {
      backgroundColor: "var(--rf-danger-surface)",
      color: "var(--rf-danger)",
      borderColor: "var(--rf-danger-border)",
      opacity: disabled || loading ? 0.6 : 1,
    },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      className={`rf-button rf-button-${variant} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: "14px",
            height: "14px",
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            display: "inline-block",
          }}
        />
      ) : (
        icon && iconPosition === "left" && <span style={{ display: "inline-flex" }}>{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === "right" && (
        <span style={{ display: "inline-flex" }}>{icon}</span>
      )}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .rf-button-primary:hover:not(:disabled) {
          background-color: var(--rf-emerald-hover) !important;
          border-color: var(--rf-emerald-hover) !important;
        }
        .rf-button-secondary:hover:not(:disabled) {
          background-color: var(--rf-canvas) !important;
          border-color: #cbd5e1 !important;
        }
        .rf-button-ghost:hover:not(:disabled) {
          background-color: rgba(16, 42, 67, 0.05) !important;
        }
        .rf-button-outline:hover:not(:disabled) {
          background-color: var(--rf-canvas) !important;
        }
        .rf-button-danger:hover:not(:disabled) {
          background-color: rgba(229, 72, 77, 0.14) !important;
        }
        .rf-button:active:not(:disabled) {
          transform: translateY(1px);
        }
      `}</style>
    </button>
  );
};
