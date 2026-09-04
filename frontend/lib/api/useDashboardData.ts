"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { DashboardDataBundle } from "../types/dashboard";

export interface UseDashboardDataResult {
  data: DashboardDataBundle | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardDataBundle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard data (HTTP ${res.status})`);
      }

      const bundle: DashboardDataBundle = await res.json();
      setData(bundle);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve dashboard metrics.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        const res = await fetch("/api/dashboard", {
          method: "GET",
          headers: { "Accept": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch dashboard data (HTTP ${res.status})`);
        }

        const bundle: DashboardDataBundle = await res.json();
        if (!ignore) {
          setData(bundle);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve dashboard metrics.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    initialFetch();

    return () => {
      ignore = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await loadData();
    });
  }, [loadData]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
