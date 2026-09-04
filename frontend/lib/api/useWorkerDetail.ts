"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { WorkerDetailItem } from "../types/infrastructure";

export interface UseWorkerDetailResult {
  workerData: WorkerDetailItem | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isNotFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWorkerDetail(workerId: string): UseWorkerDetailResult {
  const [workerData, setWorkerData] = useState<WorkerDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorker = useCallback(async () => {
    if (!workerId) return;
    try {
      const res = await fetch(`/api/workers/${encodeURIComponent(workerId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.status === 404) {
        setIsNotFound(true);
        setWorkerData(null);
        setError("Worker not found");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundle: WorkerDetailItem = await res.json();
      setWorkerData(bundle);
      setIsNotFound(false);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve worker details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      if (!workerId) return;
      try {
        const res = await fetch(`/api/workers/${encodeURIComponent(workerId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!ignore) {
            setIsNotFound(true);
            setWorkerData(null);
            setError("Worker not found");
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: WorkerDetailItem = await res.json();
        if (!ignore) {
          setWorkerData(bundle);
          setIsNotFound(false);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve worker details.";
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
  }, [workerId]);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await loadWorker();
    });
  }, [loadWorker]);

  return {
    workerData,
    isLoading,
    isRefreshing,
    isNotFound,
    error,
    refresh,
  };
}
