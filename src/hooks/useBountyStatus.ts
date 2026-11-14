import { useSyncExternalStore, useCallback, useEffect, useRef } from 'react';
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

/**
 * Shared bounty status hook — uses the module-level poller registry
 * so multiple components on the same page share one fetch loop (#631).
 *
 * Stops polling once a terminal status is observed (#632, #924).
 */
export function useBountyStatus({
  bountyId,
  interval = 5000,
  enabled = true,
  onStatusChange,
}: UseBountyStatusOptions): UseBountyStatusResult {
  const snapshot = useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) =>
        subscribeBounty(bountyId, onStoreChange, interval, enabled),
      [bountyId, enabled, interval],
    ),
    () => getBountySnapshot(bountyId),
    () => getBountySnapshot(bountyId),
  );

  const refetch = useCallback(async () => {
    refetchBounty(bountyId);
  }, [bountyId]);

  const status = snapshot.bounty?.status ?? null;
  const lastNotifiedStatusRef = useRef<BountyStatus | null>(null);

  useEffect(() => {
    if (status !== null && status !== lastNotifiedStatusRef.current) {
      lastNotifiedStatusRef.current = status;
      onStatusChange?.(status);
    }
  }, [status, onStatusChange]);

  const isTerminal = status !== null && TERMINAL_STATUSES.has(status);

  return {
    bounty: snapshot.bounty,
    isLoading: snapshot.loading && !snapshot.bounty,
    error: snapshot.error,
    refetch,
    isPolling: enabled && !isTerminal,
    isLive: enabled && !isTerminal,
    status,
    source: snapshot.source,
  };
}
