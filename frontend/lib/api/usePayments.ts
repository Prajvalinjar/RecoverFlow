"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { PaymentsListResponse, PaymentItem, PaymentsSummary } from "../types/payments";

export interface UsePaymentsResult {
  payments: PaymentItem[];
  summary: PaymentsSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLive: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePayments(): UsePaymentsResult {
  const [data, setData] = useState<PaymentsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/payments", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to load payments (HTTP ${res.status})`);
      }

      const bundle: PaymentsListResponse = await res.json();
      setData(bundle);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve payments.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      try {
        const res = await fetch("/api/payments", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: PaymentsListResponse = await res.json();
        if (!ignore) {
          setData(bundle);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve payments.";
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
      await loadPayments();
    });
  }, [loadPayments]);

  return {
    payments: data?.payments || [],
    summary: data?.summary || null,
    isLoading,
    isRefreshing,
    isLive: data?.isLive ?? false,
    error,
    refresh,
  };
}
