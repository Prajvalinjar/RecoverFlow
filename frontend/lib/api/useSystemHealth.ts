"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { SystemHealthBundle } from "../types/infrastructure";

export interface UseSystemHealthResult {
  health: SystemHealthBundle | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLive: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSystemHealth(): UseSystemHealthResult {
  const [health, setHealth] = useState<SystemHealthBundle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/system-health", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundle: SystemHealthBundle = await res.json();
      setHealth(bundle);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve system health telemetry.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      try {
        const res = await fetch("/api/system-health", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: SystemHealthBundle = await res.json();
        if (!ignore) {
          setHealth(bundle);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve system health telemetry.";
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
      await loadHealth();
    });
  }, [loadHealth]);

  return {
    health,
    isLoading,
    isRefreshing,
    isLive: health?.isLive ?? false,
    error,
    refresh,
  };
}
