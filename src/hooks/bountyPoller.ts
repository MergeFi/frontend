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

export interface BountySnapshot {
  bounty: Bounty | null;
  source: 'live' | 'mock' | null;
  loading: boolean;
  error: Error | null;
}

interface PollerEntry {
  bounty: Bounty | null;
  source: 'live' | 'mock' | null;
  listeners: Set<() => void>;
  intervalId: ReturnType<typeof setInterval> | null;
  interval: number;
  loading: boolean;
  error: Error | null;
  snapshot: BountySnapshot;
}

const EMPTY_SNAPSHOT: BountySnapshot = Object.freeze({
  bounty: null,
  source: null,
  loading: false,
  error: null,
});

const registry = new Map<string, PollerEntry>();

function updateSnapshot(entry: PollerEntry): void {
  if (
    entry.snapshot.bounty === entry.bounty &&
    entry.snapshot.source === entry.source &&
    entry.snapshot.loading === entry.loading &&
    entry.snapshot.error === entry.error
  ) {
    return;
  }
  entry.snapshot = {
    bounty: entry.bounty,
    source: entry.source,
    loading: entry.loading,
    error: entry.error,
  };
}

function notify(entry: PollerEntry): void {
  updateSnapshot(entry);
  for (const listener of entry.listeners) {
    listener();
  }
}

function startPolling(id: string, entry: PollerEntry, interval: number, pollLoop: boolean = true): void {
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
  if (pollLoop) {
    entry.intervalId = setInterval(() => {
      void tick();
    }, interval);
  }
}

function stopPolling(entry: PollerEntry): void {
  if (entry.intervalId) {
    clearInterval(entry.intervalId);
    entry.intervalId = null;
  }
}

export function getBountySnapshot(id: string): BountySnapshot {
  const entry = registry.get(id);
  return entry ? entry.snapshot : EMPTY_SNAPSHOT;
}

export function subscribeBounty(
  id: string,
  listener: () => void,
  interval: number = 5000,
  pollLoop: boolean = true,
): () => void {
  let entry = registry.get(id);
  const isNew = !entry;
  if (!entry) {
    const initialSnapshot: BountySnapshot = {
      bounty: null,
      source: null,
      loading: true,
      error: null,
    };
    entry = {
      bounty: null,
      source: null,
      listeners: new Set(),
      intervalId: null,
      interval,
      loading: true,
      error: null,
      snapshot: initialSnapshot,
    };
    registry.set(id, entry);
  }

  entry.listeners.add(listener);

  if (isNew) {
    startPolling(id, entry, interval, pollLoop);
  } else if (pollLoop && interval < entry.interval && entry.intervalId) {
    clearInterval(entry.intervalId);
    entry.intervalId = null;
    startPolling(id, entry, interval, true);
  }

  return () => {
    entry!.listeners.delete(listener);
    if (entry!.listeners.size === 0) {
      stopPolling(entry!);
      registry.delete(id);
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
