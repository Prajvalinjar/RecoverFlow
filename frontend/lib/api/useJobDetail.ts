"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { JobDetailBundle } from "../types/jobs";

export interface UseJobDetailResult {
  jobData: JobDetailBundle | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isNotFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useJobDetail(jobId: string): UseJobDetailResult {
  const [jobData, setJobData] = useState<JobDetailBundle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (res.status === 404) {
        setIsNotFound(true);
        setJobData(null);
        setError("Recovery job not found");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load job investigation (HTTP ${res.status})`);
      }

      const bundle: JobDetailBundle = await res.json();
      setJobData(bundle);
      setIsNotFound(false);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve job details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      if (!jobId) return;
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!ignore) {
            setIsNotFound(true);
            setJobData(null);
            setError("Recovery job not found");
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: JobDetailBundle = await res.json();
        if (!ignore) {
          setJobData(bundle);
          setIsNotFound(false);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve job details.";
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
  }, [jobId]);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await loadJob();
    });
  }, [loadJob]);

  return {
    jobData,
    isLoading,
    isRefreshing,
    isNotFound,
    error,
    refresh,
  };
}
