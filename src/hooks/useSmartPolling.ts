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
}
