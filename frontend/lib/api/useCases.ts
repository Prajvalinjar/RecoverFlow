"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { CasesListResponse, CaseListItem, CasesListSummary } from "../types/cases";

export interface UseCasesResult {
  cases: CaseListItem[];
  summary: CasesListSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLive: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCases(): UseCasesResult {
  const [data, setData] = useState<CasesListResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    try {
      const res = await fetch("/api/cases", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to load cases (HTTP ${res.status})`);
      }

      const bundle: CasesListResponse = await res.json();
      setData(bundle);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve cases.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      try {
        const res = await fetch("/api/cases", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: CasesListResponse = await res.json();
        if (!ignore) {
          setData(bundle);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve cases.";
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
      await loadCases();
    });
  }, [loadCases]);

  return {
    cases: data?.cases || [],
    summary: data?.summary || null,
    isLoading,
    isRefreshing,
    isLive: data?.isLive ?? false,
    error,
    refresh,
  };
}
