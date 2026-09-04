"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { AuditPageResponse, AuditEventItem, AuditSummary } from "../types/integrity";

export interface UseAuditResult {
  events: AuditEventItem[];
  summary: AuditSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLive: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAudit(): UseAuditResult {
  const [data, setData] = useState<AuditPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loadAudit = useCallback(async () => {
    try {
      const res = await fetch("/api/audit", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundle: AuditPageResponse = await res.json();
      setData(bundle);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve audit events.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      try {
        const res = await fetch("/api/audit", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: AuditPageResponse = await res.json();
        if (!ignore) {
          setData(bundle);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve audit events.";
          setError(msg);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    initialFetch();
    return () => {
      ignore = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await loadAudit();
    });
  }, [loadAudit]);

  return {
    events: data?.events || [],
    summary: data?.summary || null,
    isLoading,
    isRefreshing,
    isLive: data?.isLive ?? false,
    error,
    refresh,
  };
}
