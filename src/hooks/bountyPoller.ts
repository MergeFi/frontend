import { fetchBounty } from '@/lib/api';
import type { Bounty } from '@/types/bounty';
import { TERMINAL_STATUSES } from '@/types/bounty';

export interface BountySnapshot {
  bounty: Bounty | null;
  source: 'live' | 'mock' | null;
  loading: boolean;
  error: Error | null;
}

const DEFAULT_SNAPSHOT: BountySnapshot = Object.freeze({
  bounty: null,
  source: null,
  loading: true,
  error: null,
});

interface PollerEntry {
  id: string;
  bounty: Bounty | null;
  source: 'live' | 'mock' | null;
  loading: boolean;
  error: Error | null;
  snapshot: BountySnapshot;
  subscribers: Map<() => void, { interval: number; enabled: boolean }>;
  timerId: ReturnType<typeof setTimeout> | null;
  inFlight: boolean;
}

const registry = new Map<string, PollerEntry>();

function updateSnapshot(entry: PollerEntry): void {
  entry.snapshot = {
    bounty: entry.bounty,
    source: entry.source,
    loading: entry.loading,
    error: entry.error,
  };
}

function notify(entry: PollerEntry): void {
  for (const listener of entry.subscribers.keys()) {
    listener();
  }
}

function stopTimer(entry: PollerEntry): void {
  if (entry.timerId) {
    clearTimeout(entry.timerId);
    entry.timerId = null;
  }
}

function getActiveInterval(entry: PollerEntry): number | null {
  const enabledIntervals: number[] = [];
  for (const sub of entry.subscribers.values()) {
    if (sub.enabled) {
      enabledIntervals.push(sub.interval);
    }
  }
  if (enabledIntervals.length === 0) return null;
  return Math.min(...enabledIntervals);
}

function scheduleNext(entry: PollerEntry): void {
  stopTimer(entry);

  if (entry.bounty && TERMINAL_STATUSES.has(entry.bounty.status)) {
    return;
  }

  const interval = getActiveInterval(entry);
  if (interval === null) {
    return;
  }

  entry.timerId = setTimeout(() => {
    void executeFetch(entry);
  }, interval);
}

async function executeFetch(entry: PollerEntry): Promise<void> {
  if (entry.inFlight) return;
  entry.inFlight = true;

  try {
    const result = await fetchBounty(entry.id);
    entry.bounty = result.data ?? null;
    entry.source = result.source;
    entry.error = null;
  } catch (err) {
    entry.error = err instanceof Error ? err : new Error('Failed to fetch bounty');
  } finally {
    entry.inFlight = false;
    entry.loading = false;
    updateSnapshot(entry);
    notify(entry);
    scheduleNext(entry);
  }
}

export function getBountySnapshot(id: string): BountySnapshot {
  const entry = registry.get(id);
  return entry ? entry.snapshot : DEFAULT_SNAPSHOT;
}

export function subscribeBounty(
  id: string,
  listener: () => void,
  interval: number = 5000,
  enabled: boolean = true,
): () => void {
  let entry = registry.get(id);
  const isNew = !entry;

  if (!entry) {
    entry = {
      id,
      bounty: null,
      source: null,
      loading: true,
      error: null,
      snapshot: {
        bounty: null,
        source: null,
        loading: true,
        error: null,
      },
      subscribers: new Map(),
      timerId: null,
      inFlight: false,
    };
    registry.set(id, entry);
  }

  entry.subscribers.set(listener, { interval, enabled });

  if (isNew) {
    void executeFetch(entry);
  } else {
    scheduleNext(entry);
  }

  return () => {
    const currentEntry = registry.get(id);
    if (!currentEntry) return;

    currentEntry.subscribers.delete(listener);

    if (currentEntry.subscribers.size === 0) {
      stopTimer(currentEntry);
      registry.delete(id);
    } else {
      scheduleNext(currentEntry);
    }
  };
}

export function refetchBounty(id: string): void {
  const entry = registry.get(id);
  if (!entry) return;
  entry.loading = true;
  updateSnapshot(entry);
  notify(entry);
  void executeFetch(entry);
}
