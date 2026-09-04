"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { WorkersPageResponse, WorkerDetailItem, WorkersSummary } from "../types/infrastructure";

export interface UseWorkersResult {
  workers: WorkerDetailItem[];
  summary: WorkersSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLive: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWorkers(): UseWorkersResult {
  const [data, setData] = useState<WorkersPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loadWorkers = useCallback(async () => {
    try {
      const res = await fetch("/api/workers", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundle: WorkersPageResponse = await res.json();
      setData(bundle);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve workers.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      try {
        const res = await fetch("/api/workers", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: WorkersPageResponse = await res.json();
        if (!ignore) {
          setData(bundle);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve workers.";
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
      await loadWorkers();
    });
  }, [loadWorkers]);

  return {
    workers: data?.workers || [],
    summary: data?.summary || null,
    isLoading,
    isRefreshing,
    isLive: data?.isLive ?? false,
    error,
    refresh,
  };
}
