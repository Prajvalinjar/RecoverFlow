"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { ReconciliationItem } from "../types/integrity";

export interface UseReconciliationDetailResult {
  recordData: ReconciliationItem | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isNotFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useReconciliationDetail(reconciliationId: string): UseReconciliationDetailResult {
  const [recordData, setRecordData] = useState<ReconciliationItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecord = useCallback(async () => {
    if (!reconciliationId) return;
    try {
      const res = await fetch(`/api/reconciliation/${encodeURIComponent(reconciliationId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.status === 404) {
        setIsNotFound(true);
        setRecordData(null);
        setError("Reconciliation record not found");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundle: ReconciliationItem = await res.json();
      setRecordData(bundle);
      setIsNotFound(false);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve reconciliation details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [reconciliationId]);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      if (!reconciliationId) return;
      try {
        const res = await fetch(`/api/reconciliation/${encodeURIComponent(reconciliationId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!ignore) {
            setIsNotFound(true);
            setRecordData(null);
            setError("Reconciliation record not found");
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: ReconciliationItem = await res.json();
        if (!ignore) {
          setRecordData(bundle);
          setIsNotFound(false);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve reconciliation details.";
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
  }, [reconciliationId]);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await loadRecord();
    });
  }, [loadRecord]);

  return {
    recordData,
    isLoading,
    isRefreshing,
    isNotFound,
    error,
    refresh,
  };
}
