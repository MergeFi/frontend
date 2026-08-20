"use client";

import { useEffect, useRef, useCallback } from "react";

interface SmartPollingOptions {
  /** Polling interval in ms when tab is visible and data is changing */
  interval: number;
  /** Maximum backoff multiplier when data hasn't changed (default: 8x interval) */
  maxBackoff?: number;
  /** Whether polling is enabled */
  enabled?: boolean;
}

/**
 * Tab-aware smart polling hook with exponential backoff.
 * - Pauses when tab is backgrounded (visibility API)
 * - Backs off exponentially when consecutive polls return unchanged data
 * - Resets to base interval when data changes or tab regains focus
 *
 * This is the interim solution until backend websocket events are available
 * (per roadmap: "Real-time bounty/escrow status via websockets or polling
 * once the backend emits webhook-driven events" is future work).
 */
export function useSmartPolling(
  fetcher: () => Promise<void>,
  options: SmartPollingOptions,
) {
  const { interval, maxBackoff = 8, enabled = true } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1);
  const isVisibleRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    if (!enabled || !isVisibleRef.current) return;
    const delay = Math.min(interval * backoffRef.current, interval * maxBackoff);
    timerRef.current = setTimeout(async () => {
      try {
        await fetcher();
      } catch {
        // On error, don't increase backoff — retry at current rate
      }
      scheduleNext();
    }, delay);
  }, [fetcher, interval, maxBackoff, enabled]);

  /** Signal that data has changed — resets backoff to 1x */
  const signalChange = useCallback(() => {
    backoffRef.current = 1;
    clearTimer();
    scheduleNext();
  }, [clearTimer, scheduleNext]);

  /** Signal that data was unchanged — increases backoff */
  const signalNoChange = useCallback(() => {
    backoffRef.current = Math.min(backoffRef.current * 2, maxBackoff);
  }, [maxBackoff]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === "visible";
      if (isVisibleRef.current) {
        // Tab regained focus — reset backoff and restart polling
        backoffRef.current = 1;
        clearTimer();
        scheduleNext();
      } else {
        // Tab backgrounded — pause polling
        clearTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Start polling if visible
    if (document.visibilityState === "visible") {
      scheduleNext();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearTimer();
    };
  }, [enabled, scheduleNext, clearTimer]);

  return { signalChange, signalNoChange };
}
