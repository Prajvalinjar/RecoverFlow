"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { AnalyticsDataBundle, AnalyticsTimeframe } from "../types/analytics";

export interface UseAnalyticsResult {
  data: AnalyticsDataBundle | null;
  timeframe: AnalyticsTimeframe;
  setTimeframe: (tf: AnalyticsTimeframe) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAnalytics(initialTimeframe: AnalyticsTimeframe = "30D"): UseAnalyticsResult {
  const [data, setData] = useState<AnalyticsDataBundle | null>(null);
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>(initialTimeframe);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch analytics data (HTTP ${res.status})`);
      }

      const bundle: AnalyticsDataBundle = await res.json();
      setData(bundle);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve recovery analytics.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialLoad() {
      try {
        const res = await fetch("/api/analytics", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch analytics data (HTTP ${res.status})`);
        }

        const bundle: AnalyticsDataBundle = await res.json();
        if (!ignore) {
          setData(bundle);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve recovery analytics.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      ignore = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await fetchData();
    });
  }, [fetchData]);

  return {
    data,
    timeframe,
    setTimeframe,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
