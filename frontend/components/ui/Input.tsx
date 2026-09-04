"use client";

import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      icon,
      iconPosition = "left",
      error,
      label,
      hint,
      className = "",
      style,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
        {label && (
          <label
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--rf-text-secondary)",
            }}
          >
            {label}
          </label>
        )}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          {icon && iconPosition === "left" && (
            <span
              style={{
                position: "absolute",
                left: "12px",
                display: "inline-flex",
                alignItems: "center",
                color: "var(--rf-text-muted)",
                pointerEvents: "none",
                fontSize: "14px",
              }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            disabled={disabled}
            style={{
              width: "100%",
              height: "38px",
              paddingLeft: icon && iconPosition === "left" ? "36px" : "12px",
              paddingRight: icon && iconPosition === "right" ? "36px" : "12px",
              backgroundColor: disabled ? "var(--rf-surface-subtle)" : "var(--rf-surface)",
              color: "var(--rf-text-primary)",
              border: `1px solid ${error ? "var(--rf-danger)" : "var(--rf-border)"}`,
              borderRadius: "var(--rf-radius-control)",
              fontSize: "13.5px",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 140ms ease-in-out, background-color 140ms ease-in-out",
              ...style,
            }}
            className={`rf-input ${className}`}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <span
              style={{
                position: "absolute",
                right: "12px",
                display: "inline-flex",
                alignItems: "center",
                color: "var(--rf-text-muted)",
                pointerEvents: "none",
                fontSize: "14px",
              }}
            >
              {icon}
            </span>
          )}
        </div>
        {error ? (
          <span style={{ fontSize: "12px", color: "var(--rf-danger)", fontWeight: 500 }}>
            {error}
          </span>
        ) : hint ? (
          <span style={{ fontSize: "12px", color: "var(--rf-text-muted)" }}>{hint}</span>
        ) : null}
        <style jsx>{`
          .rf-input:focus {
            border-color: var(--rf-cyan) !important;
            background-color: #FFFFFF !important;
          }
          .rf-input::placeholder {
            color: var(--rf-text-muted);
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }
);

Input.displayName = "Input";
