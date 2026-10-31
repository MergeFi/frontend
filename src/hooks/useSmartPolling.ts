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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIntervalRef = useRef(interval);
  const unchangedCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const previousDataRef = useRef<T | null>(null);

  // Stabilne referencje do callbacków zapobiegają niepożądanym restartom efektu
  const fetchFnRef = useRef(fetchFn);
  const compareFnRef = useRef(compareFn);
  const onDataChangeRef = useRef(onDataChange);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
    compareFnRef.current = compareFn;
    onDataChangeRef.current = onDataChange;
  });

  const executePoll = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const result = await fetchFnRef.current();

      if (!isMountedRef.current) return;

      const hasChanged = previousDataRef.current !== null
        ? !compareFnRef.current(previousDataRef.current, result)
        : true;

      if (hasChanged) {
        setData(result);
        previousDataRef.current = result;
        unchangedCountRef.current = 0;
        currentIntervalRef.current = interval;
        dispatch({ type: 'STOP_BACKOFF' });
        onDataChangeRef.current?.(result);
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
  }, [interval, backoffMultiplier, maxBackoff, unchangedThreshold]);

  const scheduleNextRef = useRef<() => void>(() => {});

  const scheduleNext = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled || (typeof document !== 'undefined' && document.hidden)) {
      return;
    }

    timerRef.current = setTimeout(() => {
      void executePoll().then(() => {
        scheduleNextRef.current();
      });
    }, currentIntervalRef.current);
  }, [enabled, executePoll]);

  useEffect(() => {
    scheduleNextRef.current = scheduleNext;
  }, [scheduleNext]);

  const refetch = useCallback(async () => {
    currentIntervalRef.current = interval;
    dispatch({ type: 'STOP_BACKOFF' });
    unchangedCountRef.current = 0;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await executePoll();
    scheduleNext();
  }, [executePoll, interval, scheduleNext]);

  // Obsługa minimalizacji / zmiany karty
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        dispatch({ type: 'STOP_POLLING' });
      } else if (enabled) {
        dispatch({ type: 'START_POLLING' });
        void executePoll().then(() => {
          scheduleNext();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, executePoll, scheduleNext]);

  // Cykl życia odpytywania
  useEffect(() => {
    if (!enabled) {
      dispatch({ type: 'STOP_POLLING' });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    dispatch({ type: 'START_POLLING' });

    void executePoll().then(() => {
      scheduleNext();
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, executePoll, scheduleNext]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    isPolling: pollingState.isPolling,
    isBackingOff: pollingState.isBackingOff,
  };
}
