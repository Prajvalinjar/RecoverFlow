"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  OperationsOverviewBundle,
  SupportedControlAction,
  ControlActionResponse,
} from "../types/operations";

export type ActionExecutionStatus = "IDLE" | "REQUESTING" | "SUCCESS" | "FAILED";

export interface ActionFeedback {
  status: ActionExecutionStatus;
  action?: SupportedControlAction;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface UseOperationsResult {
  overview: OperationsOverviewBundle | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isApplying: boolean;
  isLive: boolean;
  error: string | null;
  feedback: ActionFeedback;
  refresh: () => Promise<void>;
  dispatchAction: (action: SupportedControlAction) => Promise<ControlActionResponse | null>;
  clearFeedback: () => void;
}

export function useOperations(): UseOperationsResult {
  const [overview, setOverview] = useState<OperationsOverviewBundle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ActionFeedback>({ status: "IDLE" });

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/operations", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OperationsOverviewBundle = await res.json();
      setOverview(data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to load operational status.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initialFetch() {
      try {
        const res = await fetch("/api/operations", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: OperationsOverviewBundle = await res.json();
        if (!ignore) {
          setOverview(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Unable to load operational status.";
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
      await loadOverview();
    });
  }, [loadOverview]);

  const clearFeedback = useCallback(() => {
    setFeedback({ status: "IDLE" });
  }, []);

  const dispatchAction = useCallback(
    async (action: SupportedControlAction): Promise<ControlActionResponse | null> => {
      if (isApplying) return null; // Duplicate action prevention

      setIsApplying(true);
      setFeedback({
        status: "REQUESTING",
        action,
        message: "Submitting operational change to control engine...",
        timestamp: new Date().toISOString(),
      });

      try {
        const res = await fetch("/api/operations/control", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ action }),
        });

        const data: ControlActionResponse = await res.json();

        if (!res.ok || data.status === "FAILED") {
          const errMsg = data.message || data.error || `HTTP ${res.status}`;
          setFeedback({
            status: "FAILED",
            action,
            error: errMsg,
            message: "Action failed. Previous confirmed state preserved.",
            timestamp: new Date().toISOString(),
          });
          return data;
        }

        setFeedback({
          status: "SUCCESS",
          action,
          message: data.message || "Operation executed successfully.",
          timestamp: data.timestamp,
        });

        // Immediately re-fetch authoritative state after confirmed success
        await loadOverview();
        return data;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Network failure during control request.";
        setFeedback({
          status: "FAILED",
          action,
          error: errMsg,
          message: "Action failed. Previous confirmed state preserved.",
          timestamp: new Date().toISOString(),
        });
        return null;
      } finally {
        setIsApplying(false);
      }
    },
    [isApplying, loadOverview]
  );

  return {
    overview,
    isLoading,
    isRefreshing,
    isApplying,
    isLive: overview?.isLive ?? false,
    error,
    feedback,
    refresh,
    dispatchAction,
    clearFeedback,
  };
}
