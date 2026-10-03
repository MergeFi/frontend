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

export function useSmartPolling<T>({
  fetchFn,
  interval = 5000,
  enabled = true,
  backoffMultiplier = 1.5,
  maxBackoff = 30000,
  unchangedThreshold = 3,
  compareFn = (a, b) => JSON.stringify(a) === JSON.stringify(b),
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

  // Keep the latest callbacks in refs so the polling interval does not need
  // to be torn down and recreated when the caller passes inline functions.
  const fetchFnRef = useRef(fetchFn);
  const compareFnRef = useRef(compareFn);
  const onDataChangeRef = useRef(onDataChange);
  const intervalBaseRef = useRef(interval);
  const backoffMultiplierRef = useRef(backoffMultiplier);
  const maxBackoffRef = useRef(maxBackoff);
  const unchangedThresholdRef = useRef(unchangedThreshold);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
    compareFnRef.current = compareFn;
    onDataChangeRef.current = onDataChange;
    intervalBaseRef.current = interval;
    backoffMultiplierRef.current = backoffMultiplier;
    maxBackoffRef.current = maxBackoff;
    unchangedThresholdRef.current = unchangedThreshold;
  });

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      const result = await fetchFnRef.current();

      if (!isMountedRef.current) return;

      const hasChanged = previousDataRef.current !== null
        ? !compareFnRef.current(previousDataRef.current, result)
        : true;

      if (hasChanged) {
        setData(result);
        previousDataRef.current = result;
        unchangedCountRef.current = 0;
        currentIntervalRef.current = intervalBaseRef.current;
        dispatch({ type: 'STOP_BACKOFF' });
        onDataChangeRef.current?.(result);
        // Restart the interval so the running timer picks up the reset interval.
        restartInterval();
      } else {
        unchangedCountRef.current += 1;

        if (unchangedCountRef.current >= unchangedThresholdRef.current) {
          const newInterval = Math.min(
            currentIntervalRef.current * backoffMultiplierRef.current,
            maxBackoffRef.current
          );
          if (newInterval > currentIntervalRef.current) {
            currentIntervalRef.current = newInterval;
            dispatch({ type: 'START_BACKOFF' });
            // Restart the interval so the running timer uses the backed-off interval.
            restartInterval();
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
  }, []);

  const restartInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isMountedRef.current && !document.hidden) {
      intervalRef.current = setInterval(fetchData, currentIntervalRef.current);
    }
  }, [fetchData]);

  const refetch = useCallback(async () => {
    currentIntervalRef.current = intervalBaseRef.current;
    dispatch({ type: 'STOP_BACKOFF' });
    unchangedCountRef.current = 0;
    restartInterval();
    await fetchData();
  }, [fetchData, restartInterval]);

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
        restartInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, fetchData, restartInterval]);

  // Main polling effect
  const hasInitialized = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return;
    }

    // Only start polling on initial mount or when enabled changes from false to true.
    // The interval itself is not recreated when fetchFn/compareFn change because
    // those are read through refs (see fetchData above).
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
