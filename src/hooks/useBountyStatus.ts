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
 * Stops polling once a terminal status is observed (#632).
 */
export function useBountyStatus({ bountyId, interval = 5000, enabled = true, onStatusChange }: UseBountyStatusOptions): UseBountyStatusResult {
  // `enabled` gates the repeating poll, not the initial load — a mounted
  // component still needs one fetch to render status, or it hangs on the
  // fallback forever (#632 semantics).
  const snapshot = useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) =>
        subscribeBounty(bountyId, onStoreChange, enabled ? interval : 0),
      [bountyId, enabled, interval],
    ),
    () => getBountySnapshot(bountyId),
    () => getBountySnapshot(bountyId),
  );

  const refetch = useCallback(async () => {
    refetchBounty(bountyId);
  }, [bountyId]);

  const status = snapshot.bounty?.status ?? null;

  // Fire only on transitions — a refetch returning the same status is not a
  // change, and a mount with no data yet (null) is not either.
  const prevStatusRef = useRef<typeof status>(null);
  useEffect(() => {
    if (status !== null && status !== prevStatusRef.current) {
      prevStatusRef.current = status;
      onStatusChange?.(status);
    } else if (status !== null) {
      prevStatusRef.current = status;
    }
  }, [status, onStatusChange]);

  return {
    bounty: snapshot.bounty,
    isLoading: snapshot.loading && !snapshot.bounty,
    error: snapshot.error,
    refetch,
    isPolling: enabled && !TERMINAL_STATUSES.has(status as BountyStatus),
    isLive: enabled && !TERMINAL_STATUSES.has(status as BountyStatus),
    status,
    source: snapshot.source,
  };
}
