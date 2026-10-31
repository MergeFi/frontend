import { useSyncExternalStore, useCallback, useRef, useEffect } from 'react';
import type { Bounty, BountyStatus } from '@/types/bounty';
import { TERMINAL_STATUSES } from '@/types/bounty';
import {
  getBountySnapshot,
  subscribeBounty,
  refetchBounty,
} from './bountyPoller';

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
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      subscribeBounty(bountyId, onStoreChange, interval, enabled),
    [bountyId, interval, enabled],
  );

  const getSnapshot = useCallback(
    () => getBountySnapshot(bountyId),
    [bountyId],
  );

  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const refetch = useCallback(async () => {
    refetchBounty(bountyId);
  }, [bountyId]);

  const bounty = snapshot.bounty ?? (snapshot.loading ? (fallbackBounty ?? null) : null);
  const status = bounty?.status ?? null;

  const previousStatusRef = useRef<BountyStatus | null>(null);

  useEffect(() => {
    if (status && status !== previousStatusRef.current) {
      previousStatusRef.current = status;
      onStatusChange?.(status);
    }
  }, [status, onStatusChange]);

  const isTerminal = status ? TERMINAL_STATUSES.has(status as BountyStatus) : false;

  return {
    bounty,
    isLoading: snapshot.loading && !bounty,
    error: snapshot.error,
    refetch,
    isPolling: enabled && !isTerminal,
    isLive: enabled && !isTerminal,
    status,
    source: snapshot.source,
  };
}
