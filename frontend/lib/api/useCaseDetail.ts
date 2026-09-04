"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { CaseDetailBundle } from "../types/cases";

export interface UseCaseDetailResult {
  caseData: CaseDetailBundle | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isNotFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCaseDetail(caseId: string): UseCaseDetailResult {
  const [caseData, setCaseData] = useState<CaseDetailBundle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (res.status === 404) {
        setIsNotFound(true);
        setCaseData(null);
        setError("Recovery case not found");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load case investigation (HTTP ${res.status})`);
      }

      const bundle: CaseDetailBundle = await res.json();
      setCaseData(bundle);
      setIsNotFound(false);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve case investigation.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      if (!caseId) return;
      try {
        const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!ignore) {
            setIsNotFound(true);
            setCaseData(null);
            setError("Recovery case not found");
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: CaseDetailBundle = await res.json();
        if (!ignore) {
          setCaseData(bundle);
          setIsNotFound(false);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve case investigation.";
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
  }, [caseId]);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await loadCase();
    });
  }, [loadCase]);

  return {
    caseData,
    isLoading,
    isRefreshing,
    isNotFound,
    error,
    refresh,
  };
}
