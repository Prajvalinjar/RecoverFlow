"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { PaymentDetailBundle } from "../types/payments";

export interface UsePaymentDetailResult {
  paymentData: PaymentDetailBundle | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isNotFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePaymentDetail(paymentId: string): UsePaymentDetailResult {
  const [paymentData, setPaymentData] = useState<PaymentDetailBundle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayment = useCallback(async () => {
    if (!paymentId) return;
    try {
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (res.status === 404) {
        setIsNotFound(true);
        setPaymentData(null);
        setError("Payment transaction not found");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load payment investigation (HTTP ${res.status})`);
      }

      const bundle: PaymentDetailBundle = await res.json();
      setPaymentData(bundle);
      setIsNotFound(false);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve payment details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      if (!paymentId) return;
      try {
        const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!ignore) {
            setIsNotFound(true);
            setPaymentData(null);
            setError("Payment transaction not found");
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: PaymentDetailBundle = await res.json();
        if (!ignore) {
          setPaymentData(bundle);
          setIsNotFound(false);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve payment details.";
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
  }, [paymentId]);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await loadPayment();
    });
  }, [loadPayment]);

  return {
    paymentData,
    isLoading,
    isRefreshing,
    isNotFound,
    error,
    refresh,
  };
}
