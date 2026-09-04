"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { AuditEventItem } from "../types/integrity";

export interface UseAuditDetailResult {
  eventData: AuditEventItem | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isNotFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAuditDetail(eventId: string): UseAuditDetailResult {
  const [eventData, setEventData] = useState<AuditEventItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/audit/${encodeURIComponent(eventId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.status === 404) {
        setIsNotFound(true);
        setEventData(null);
        setError("Audit event not found");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bundle: AuditEventItem = await res.json();
      setEventData(bundle);
      setIsNotFound(false);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to retrieve audit event details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      if (!eventId) return;
      try {
        const res = await fetch(`/api/audit/${encodeURIComponent(eventId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!ignore) {
            setIsNotFound(true);
            setEventData(null);
            setError("Audit event not found");
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bundle: AuditEventItem = await res.json();
        if (!ignore) {
          setEventData(bundle);
          setIsNotFound(false);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to retrieve audit event details.";
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
  }, [eventId]);

  const refresh = useCallback(async () => {
    startRefreshTransition(async () => {
      await loadEvent();
    });
  }, [loadEvent]);

  return {
    eventData,
    isLoading,
    isRefreshing,
    isNotFound,
    error,
    refresh,
  };
}
