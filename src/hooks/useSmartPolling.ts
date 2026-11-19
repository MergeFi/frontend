'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmartPollingOptions<T> {
  /** The async function that fetches the latest data. */
  fetchFn: () => Promise<T>;
  /** Interval between polls in ms (default 5 000). */
  intervalMs?: number;
  /** Whether polling is active (default true). */
  enabled?: boolean;
  /**
   * Optional equality check; return true when the new value equals the
   * previous one so a re-render is skipped.  Defaults to `Object.is`.
   */
  compareFn?: (prev: T | undefined, next: T) => boolean;
  /** Called whenever the data changes (passes equality check). */
  onDataChange?: (data: T) => void;
}

export interface SmartPollingState<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  pollCount: number;
}

type Action<T> =
  | { type: 'START_POLLING' }
  | { type: 'FETCH_SUCCESS'; payload: T; changed: boolean }
  | { type: 'FETCH_ERROR'; error: Error };

function reducer<T>(
  state: SmartPollingState<T>,
  action: Action<T>,
): SmartPollingState<T> {
  switch (action.type) {
    case 'START_POLLING':
      return { ...state, isLoading: state.data === undefined };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
        data: action.changed ? action.payload : state.data,
        pollCount: state.pollCount + 1,
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.error };
  }
}

const initialState = <T>(): SmartPollingState<T> => ({
  data: undefined,
  isLoading: false,
  error: null,
  pollCount: 0,
});

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Polls `fetchFn` on a fixed interval while `enabled` is true.
 *
 * **Fix for #878:** The original implementation used a `hasInitialized` latch
 * that prevented the interval from being recreated after cleanup.  Because
 * `fetchData` changed identity every time an inline `fetchFn` / `compareFn` /
 * `onDataChange` prop changed, the effect re-ran, cleaned up the interval,
 * and silently stopped polling forever.
 *
 * The fix stores `fetchFn`, `compareFn` and `onDataChange` in refs (updated by
 * a separate layout effect) so `fetchData` can be stable (empty dep array).
 * The main interval effect depends only on `enabled` and the stable
 * `fetchData`, removing the need for the latch entirely.
 */
export function useSmartPolling<T>({
  fetchFn,
  intervalMs = 5_000,
  enabled = true,
  compareFn,
  onDataChange,
}: SmartPollingOptions<T>): SmartPollingState<T> {
  const [state, dispatch] = useReducer(reducer<T>, undefined, initialState<T>);

  // Keep caller-supplied callbacks in refs so fetchData stays stable.
  const fetchFnRef      = useRef(fetchFn);
  const compareFnRef    = useRef(compareFn);
  const onDataChangeRef = useRef(onDataChange);
  const prevDataRef     = useRef<T | undefined>(undefined);
  const isMountedRef    = useRef(false);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIntervalRef = useRef(intervalMs);

  // Sync refs on every render — no dep array needed; refs don't trigger effects.
  fetchFnRef.current      = fetchFn;
  compareFnRef.current    = compareFn;
  onDataChangeRef.current = onDataChange;
  currentIntervalRef.current = intervalMs;

  // Stable fetch function — identity never changes so the interval effect
  // doesn't restart when inline props change identity between renders.
  const fetchData = useCallback(async () => {
    try {
      const result = await fetchFnRef.current();
      if (!isMountedRef.current) return;

      const eq = compareFnRef.current ?? Object.is;
      const changed = !eq(prevDataRef.current, result);
      if (changed) {
        prevDataRef.current = result;
        onDataChangeRef.current?.(result);
      }
      dispatch({ type: 'FETCH_SUCCESS', payload: result, changed });
    } catch (err) {
      if (!isMountedRef.current) return;
      dispatch({ type: 'FETCH_ERROR', error: err instanceof Error ? err : new Error(String(err)) });
    }
  }, []); // stable — deps live in refs

  // Interval effect: owns the timer lifecycle; no hasInitialized latch needed.
  useEffect(() => {
    isMountedRef.current = true;
    if (!enabled) return () => { isMountedRef.current = false; };

    dispatch({ type: 'START_POLLING' });
    fetchData();
    intervalRef.current = setInterval(fetchData, currentIntervalRef.current);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, fetchData]);

  return state;
import { useEffect, useState, useRef, useCallback, useReducer } from 'react';

export interface UseSmartPollingOptions<T> {
  fetchFn: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  backoffMultiplier?: number;
  maxBackoff?: number;
  unchangedThreshold?: number;
  compareFn?: (a: T, b: T) => boolean;
  onDataChange?: (data: T) => void;
}

export interface UseSmartPollingResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  isBackingOff: boolean;
}

type PollingState = {
  isPolling: boolean;
  isBackingOff: boolean;
};

type PollingAction = 
  | { type: 'START_POLLING' }
  | { type: 'STOP_POLLING' }
  | { type: 'START_BACKOFF' }
  | { type: 'STOP_BACKOFF' };

const pollingInitialState: PollingState = {
  isPolling: false,
  isBackingOff: false,
};

function pollingReducer(state: PollingState, action: PollingAction): PollingState {
  switch (action.type) {
    case 'START_POLLING':
      return { ...state, isPolling: true };
    case 'STOP_POLLING':
      return { ...state, isPolling: false };
    case 'START_BACKOFF':
      return { ...state, isBackingOff: true };
    case 'STOP_BACKOFF':
      return { ...state, isBackingOff: false };
    default:
      return state;
  }
}

// #881 — default change detector: shallow field equality. O(fields) instead of
// serializing the payload twice per tick, insensitive to key order, and a
// field becoming `undefined` counts as a change (JSON.stringify hid it).
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  const aRec = a as Record<string, unknown>;
  const bRec = b as Record<string, unknown>;
  const aKeys = Object.keys(aRec);
  if (aKeys.length !== Object.keys(bRec).length) return false;
  return aKeys.every(
    (key) => Object.hasOwn(bRec, key) && Object.is(aRec[key], bRec[key]),
  );
}

export function useSmartPolling<T>({
  fetchFn,
  interval = 5000,
  enabled = true,
  backoffMultiplier = 1.5,
  maxBackoff = 30000,
  unchangedThreshold = 3,
  compareFn = shallowEqual,
  onDataChange,
}: UseSmartPollingOptions<T>): UseSmartPollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pollingState, dispatch] = useReducer(pollingReducer, pollingInitialState);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIntervalRef = useRef(interval);
  const unchangedCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const previousDataRef = useRef<T | null>(null);
  const isBackgroundedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      const result = await fetchFn();
      
      if (!isMountedRef.current) return;

      const hasChanged = previousDataRef.current !== null 
        ? !compareFn(previousDataRef.current, result)
        : true;

      if (hasChanged) {
        setData(result);
        previousDataRef.current = result;
        unchangedCountRef.current = 0;
        currentIntervalRef.current = interval;
        dispatch({ type: 'STOP_BACKOFF' });
        onDataChange?.(result);
      } else {
        unchangedCountRef.current += 1;
        
        if (unchangedCountRef.current >= unchangedThreshold) {
          const newInterval = Math.min(
            currentIntervalRef.current * backoffMultiplier,
            maxBackoff
          );
          if (newInterval > currentIntervalRef.current) {
            currentIntervalRef.current = newInterval;
            dispatch({ type: 'START_BACKOFF' });
          }
        }
      }

      setError(null);
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Polling failed'));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, compareFn, interval, backoffMultiplier, maxBackoff, unchangedThreshold, onDataChange]);

  const refetch = useCallback(async () => {
    currentIntervalRef.current = interval;
    dispatch({ type: 'STOP_BACKOFF' });
    unchangedCountRef.current = 0;
    await fetchData();
  }, [fetchData, interval]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      isBackgroundedRef.current = document.hidden;
      
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        dispatch({ type: 'STOP_POLLING' });
      } else if (enabled) {
        dispatch({ type: 'START_POLLING' });
        fetchData();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(fetchData, currentIntervalRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, fetchData]);

  // Main polling effect - use a ref to track initial mount
  const hasInitialized = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return;
    }

    // Only start polling on initial mount or when enabled changes
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      dispatch({ type: 'START_POLLING' });
      fetchData();
      intervalRef.current = setInterval(fetchData, currentIntervalRef.current);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Don't dispatch STOP_POLLING here to avoid state updates during unmount
    };
  }, [enabled, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isPolling: pollingState.isPolling,
    isBackingOff: pollingState.isBackingOff,
  };
}
