"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { ProviderItem } from "../types/infrastructure";

export interface UseProviderDetailResult {
  providerData: ProviderItem | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isNotFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProviderDetail(providerId: string): UseProviderDetailResult {
  const [providerData, setProviderData] = useState<ProviderItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadProvider = useCallback(async () => {
    if (!providerId) return;
    try {
      const res = await fetch(`/api/providers/${encodeURIComponent(providerId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.status === 404) {
        setIsNotFound(true);
        setProviderData(null);
        setError("Provider not found");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundle: ProviderItem = await res.json();
      setProviderData(bundle);
      setIsNotFound(false);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve provider details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      if (!providerId) return;
      try {
        const res = await fetch(`/api/providers/${encodeURIComponent(providerId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!ignore) {
            setIsNotFound(true);
            setProviderData(null);
            setError("Provider not found");
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: ProviderItem = await res.json();
        if (!ignore) {
          setProviderData(bundle);
          setIsNotFound(false);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve provider details.";
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
  }, [providerId]);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await loadProvider();
    });
  }, [loadProvider]);

  return {
    providerData,
    isLoading,
    isRefreshing,
    isNotFound,
    error,
    refresh,
  };
}
