"use client";

import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  isMono?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T | ((row: T) => string);
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = "No records found in this view.",
  className = "",
}: DataTableProps<T>) {
  const getKey = (row: T, idx: number): string => {
    if (typeof keyField === "function") return keyField(row);
    return String(row[keyField] ?? idx);
  };

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        backgroundColor: "var(--rf-surface)",
        border: "1px solid var(--rf-border)",
        borderRadius: "var(--rf-radius-surface)",
      }}
      className={`rf-table-container ${className}`}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          fontSize: "13.5px",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "var(--rf-surface-subtle)",
              borderBottom: "1px solid var(--rf-border)",
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "12px 16px",
                  fontSize: "11px",
                  fontWeight: 650,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--rf-text-secondary)",
                  textAlign: col.align || "left",
                  width: col.width,
                  whiteSpace: "nowrap",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  color: "var(--rf-text-muted)",
                  fontSize: "13px",
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={getKey(row, rowIdx)}
                style={{
                  borderBottom:
                    rowIdx === data.length - 1 ? "none" : "1px solid var(--rf-border-subtle)",
                  transition: "background-color 100ms ease",
                }}
                className="rf-table-row"
              >
                {columns.map((col) => {
                  const content = col.render
                    ? col.render(row, rowIdx)
                    : (row[col.key] as React.ReactNode);

                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: "13px 16px",
                        textAlign: col.align || "left",
                        color: "var(--rf-navy-primary)",
                      }}
                      className={col.isMono ? "font-mono" : ""}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <style jsx>{`
        .rf-table-row:hover {
          background-color: var(--rf-surface-subtle);
        }
      `}</style>
    </div>
  );
}
