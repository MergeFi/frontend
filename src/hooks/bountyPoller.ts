/**
 * Shared bounty poller — module-level subscription registry keyed by bounty ID.
 *
 * Issue #631: Each issue page previously ran two independent pollers on the
 * same bounty (ClaimButton every 2s, LiveBountyStatus every 5s). This module
 * deduplicates them into a single fetch loop per bounty ID.
 */

import { fetchBounty } from '@/lib/api';
import type { Bounty } from '@/types/bounty';
import { TERMINAL_STATUSES } from '@/types/bounty';

interface PollerEntry {
  bounty: Bounty | null;
  source: 'live' | 'mock' | null;
  listeners: Set<() => void>;
  intervalId: ReturnType<typeof setInterval> | null;
  interval: number;
  loading: boolean;
  error: Error | null;
  // useSyncExternalStore requires the snapshot to be referentially stable
  // between notifications — a fresh object per getSnapshot() call loops
  // forever. Rebuilt only inside notify(), when state actually changed.
  snapshot: {
    bounty: Bounty | null;
    source: 'live' | 'mock' | null;
    loading: boolean;
    error: Error | null;
  };
}

const registry = new Map<string, PollerEntry>();

const EMPTY_SNAPSHOT: PollerEntry["snapshot"] = {
  bounty: null,
  source: null,
  loading: false,
  error: null,
};

function notify(entry: PollerEntry): void {
  entry.snapshot = {
    bounty: entry.bounty,
    source: entry.source,
    loading: entry.loading,
    error: entry.error,
  };
  for (const listener of entry.listeners) {
    listener();
  }
}

function startPolling(id: string, entry: PollerEntry, interval: number): void {
  if (entry.intervalId) return;
  entry.interval = interval;

  const tick = async () => {
    if (entry.listeners.size === 0) {
      stopPolling(entry);
      return;
    }

    try {
      entry.loading = true;
      notify(entry);

      const result = await fetchBounty(id, undefined);
      entry.bounty = result.data ?? null;
      entry.source = result.source;
      entry.error = null;

      // #632 — stop polling once a terminal status is observed
      if (entry.bounty && TERMINAL_STATUSES.has(entry.bounty.status)) {
        stopPolling(entry);
      }
    } catch (err) {
      entry.error = err instanceof Error ? err : new Error('Failed to fetch bounty');
    } finally {
      entry.loading = false;
      notify(entry);
    }
  };

  void tick();
  // interval <= 0 means "load once, don't poll" — subscribers that pass it
  // still get the initial fetch and every notification it produces.
  if (interval > 0) entry.intervalId = setInterval(() => void tick(), interval);
}

function stopPolling(entry: PollerEntry): void {
  if (entry.intervalId) {
    clearInterval(entry.intervalId);
    entry.intervalId = null;
  }
}

export function getBountySnapshot(id: string): {
  bounty: Bounty | null;
  source: 'live' | 'mock' | null;
  loading: boolean;
  error: Error | null;
} {
  const entry = registry.get(id);
  return entry?.snapshot ?? EMPTY_SNAPSHOT;
}

export function subscribeBounty(
  id: string,
  listener: () => void,
  interval: number = 5000,
): () => void {
  let entry = registry.get(id);
  if (!entry) {
    entry = {
      bounty: null,
      source: null,
      listeners: new Set(),
      intervalId: null,
      interval,
      loading: true,
      error: null,
      snapshot: { bounty: null, source: null, loading: true, error: null },
    };
    registry.set(id, entry);
    startPolling(id, entry, interval);
  }

  entry.listeners.add(listener);
  if (!entry.intervalId) {
    // Entry exists but isn't polling (all listeners left, or a 0-interval
    // one-shot completed): refetch so re-mounts never serve a stale
    // snapshot from a dead subscription.
    startPolling(id, entry, interval);
  } else if (interval > 0 && interval < entry.interval) {
    // Use the minimum interval of all subscribers
    clearInterval(entry.intervalId);
    entry.intervalId = null;
    startPolling(id, entry, interval);
  }

  return () => {
    entry!.listeners.delete(listener);
    if (entry!.listeners.size === 0) {
      stopPolling(entry!);
    }
  };
}

export function refetchBounty(id: string): void {
  const entry = registry.get(id);
  if (!entry) return;
  if (entry.intervalId) {
    clearInterval(entry.intervalId);
    entry.intervalId = null;
    startPolling(id, entry, entry.interval);
  }
}
