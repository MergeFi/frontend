import { useRef, useCallback, useEffect } from 'react';
import { useSmartPolling } from './useSmartPolling';
import { fetchBountyLive } from '@/lib/api';
import type { Bounty, BountyStatus } from '@/types/bounty';

interface UseBountyStatusOptions {
  bountyId: string;
  fallbackBounty?: Bounty;
  interval?: number;
  enabled?: boolean;
  onStatusChange?: (status: BountyStatus) => void;
}

interface UseBountyStatusResult {
  bounty: Bounty | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  isLive: boolean;
  status: BountyStatus | null;
  source: 'live' | 'mock' | null;
}

export function useBountyStatus({
  bountyId,
  fallbackBounty,
  interval = 5000,
  enabled = true,
  onStatusChange,
}: UseBountyStatusOptions): UseBountyStatusResult {
  const lastLiveBountyIdRef = useRef<string | null>(null);

  const fallbackRef = useRef(fallbackBounty);
  useEffect(() => {
    fallbackRef.current = fallbackBounty;
  });

  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  });

  const fetchFn = useCallback(async () => {
    try {
      const result = await fetchBountyLive(bountyId);
      lastLiveBountyIdRef.current = bountyId;
      return result;
    } catch (err) {
      // Only return static fallback before any live data has been observed for this bounty
      const hasObservedLive = lastLiveBountyIdRef.current === bountyId;
      if (!hasObservedLive && fallbackRef.current !== undefined) {
        return { data: fallbackRef.current, source: 'mock' as const };
      }
      throw err;
    }
  }, [bountyId]);

  const compareFn = useCallback(
    (
      a: { data: Bounty | undefined; source: 'live' | 'mock' } | null,
      b: { data: Bounty | undefined; source: 'live' | 'mock' } | null,
    ) => {
      const aStatus = a?.data?.status;
      const bStatus = b?.data?.status;
      return aStatus === bStatus && a?.data?.claimedBy === b?.data?.claimedBy;
    },
    [],
  );

  const handleDataChange = useCallback(
    (result: { data: Bounty | undefined; source: 'live' | 'mock' }) => {
      if (onStatusChangeRef.current && result?.data?.status) {
        onStatusChangeRef.current(result.data.status);
      }
    },
    [],
  );

  const {
    data,
    isLoading,
    error,
    refetch,
    isPolling,
    isBackingOff,
  } = useSmartPolling<{ data: Bounty | undefined; source: 'live' | 'mock' }>({
    fetchFn,
    interval,
    enabled,
    backoffMultiplier: 1.5,
    maxBackoff: 30000,
    unchangedThreshold: 3,
    compareFn,
    onDataChange: handleDataChange,
  });

  return {
    bounty: data?.data || null,
    isLoading,
    error,
    refetch,
    isPolling,
    isLive: isPolling && !isBackingOff,
    status: data?.data?.status || null,
    source: data?.source || null,
  };
}
