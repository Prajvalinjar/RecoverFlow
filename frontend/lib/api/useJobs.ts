"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { JobsPageResponse, JobItem, QueueStatus, WorkerItem } from "../types/jobs";

export interface UseJobsResult {
  jobs: JobItem[];
  queueStatus: QueueStatus | null;
  workers: WorkerItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLive: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useJobs(): UseJobsResult {
  const [data, setData] = useState<JobsPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to load jobs & queue (HTTP ${res.status})`);
      }

      const bundle: JobsPageResponse = await res.json();
      setData(bundle);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve jobs & queue state.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      try {
        const res = await fetch("/api/jobs", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: JobsPageResponse = await res.json();
        if (!ignore) {
          setData(bundle);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve jobs & queue state.";
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
      await loadJobs();
    });
  }, [loadJobs]);

  return {
    jobs: data?.jobs || [],
    queueStatus: data?.queueStatus || null,
    workers: data?.workers || [],
    isLoading,
    isRefreshing,
    isLive: data?.isLive ?? false,
    error,
    refresh,
  };
}
