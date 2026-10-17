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

const defaultCompare = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

export function useSmartPolling<T>({
  fetchFn,
  interval = 5000,
  enabled = true,
  backoffMultiplier = 1.5,
  maxBackoff = 30000,
  unchangedThreshold = 3,
  compareFn = defaultCompare,
  onDataChange,
}: UseSmartPollingOptions<T>): UseSmartPollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pollingState, dispatch] = useReducer(pollingReducer, pollingInitialState);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIntervalRef = useRef(interval);
  const unchangedCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const previousDataRef = useRef<T | null>(null);
  const isBackgroundedRef = useRef(false);
  // Latest fetchData in a ref — the interval closes over the ref, never the
  // callback, so a re-render can't tear down the timer mid-flight (#568).
  const fetchDataRef = useRef<() => Promise<void>>(async () => {});

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
  // Assign inside an effect (every render) — mutating a ref during render is
  // a react-hooks/refs violation. This effect is declared BEFORE the polling
  // effect below, so it always runs first: the interval can never observe a
  // stale fetchData.
  useEffect(() => {
    fetchDataRef.current = fetchData;
  });

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
        void fetchDataRef.current();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => void fetchDataRef.current(), currentIntervalRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  // Main polling effect — keyed on `enabled` only. `fetchData` identity churn
  // (a new fetchFn/compareFn per render) must never clear and re-arm the
  // interval, or every re-render resets the poll clock (#568). The interval
  // dereferences fetchDataRef so it always calls the latest version.
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      dispatch({ type: 'STOP_POLLING' });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    dispatch({ type: 'START_POLLING' });
    void fetchDataRef.current();
    intervalRef.current = setInterval(
      () => void fetchDataRef.current(),
      currentIntervalRef.current,
    );

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Don't dispatch STOP_POLLING here to avoid state updates during unmount
    };
  }, [enabled]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isPolling: pollingState.isPolling,
    isBackingOff: pollingState.isBackingOff,
  };
}
