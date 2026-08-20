import { API_BASE_URL } from "./config";
import { getToken } from "./auth";
import {
  adaptBounty,
  adaptMilestone,
  adaptMaintenancePool,
  adaptReputation,
  type RawBounty,
  type RawMilestone,
  type RawMaintenancePool,
  type RawReputationSnapshot,
  type RawUserProfile,
} from "./adapters";
import type { Bounty, Milestone, MaintenancePool, ReputationProfile } from "@/types";

export class ApiUnavailableError extends Error {}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    /** Retry-After header value in seconds, if present on a 429 response */
    public retryAfter?: number,
  ) {
    super(message);
  }
}

/**
 * In-flight request deduplication (Issue #44):
 * Tracks pending POST/PUT/DELETE requests by a signature derived from
 * (method, path, body). If an identical request is already in flight,
 * subsequent calls coalesce onto the same promise instead of firing a
 * duplicate network request. GET requests are not deduplicated (they're
 * idempotent and may legitimately be called concurrently for different UIs).
 */
const inflightMutations = new Map<string, Promise<unknown>>();

function mutationKey(path: string, init?: RequestInit): string {
  const method = (init?.method ?? "GET").toUpperCase();
  // Only deduplicate mutating methods
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return "";
  // Include body hash to distinguish e.g. fund vs claim on same bounty
  const bodyStr = typeof init?.body === "string" ? init.body : "";
  return `${method}:${path}:${bodyStr}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new ApiUnavailableError(`Request to ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetches live data from the MergeFi backend, falling back to the provided
 * mock value when the backend is unreachable (e.g. during frontend-only demos).
 */
export async function fetchWithFallback<T>(
  path: string,
  fallback: T,
): Promise<T> {
  try {
    return await request<T>(path);
  } catch {
    return fallback;
  }
}

/**
 * Client-side call that attaches the signed-in user's JWT (if any) and
 * surfaces backend error bodies instead of silently falling back — used for
 * actions the user explicitly triggers (claim, fund, deposit, ...), where
 * hiding a failure behind mock data would be misleading.
 *
 * Deduplication: identical concurrent mutation requests are coalesced.
 * Rate-limit awareness: 429 responses surface Retry-After and a distinct message.
 */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const key = mutationKey(path, init);

  // If an identical mutation is already in flight, coalesce onto it
  if (key && inflightMutations.has(key)) {
    return inflightMutations.get(key) as Promise<T>;
  }

  const execute = async (): Promise<T> => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      let message = body;
      try {
        message = JSON.parse(body).message ?? body;
      } catch {
        // plain-text error body, use as-is
      }

      // Rate-limit-aware error handling (Issue #44)
      if (res.status === 429) {
        const retryAfterHeader = res.headers.get("Retry-After");
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
        const rlMessage = retryAfter
          ? `Rate limited. Please wait ${retryAfter} second${retryAfter !== 1 ? "s" : ""} before trying again.`
          : "Too many requests. Please slow down and try again shortly.";
        throw new ApiRequestError(rlMessage, 429, retryAfter);
      }

      throw new ApiRequestError(message || `Request failed (${res.status})`, res.status);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  };

  if (key) {
    const promise = execute().finally(() => {
      inflightMutations.delete(key);
    });
    inflightMutations.set(key, promise);
    return promise;
  }

  return execute();
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Live-data fetchers that adapt mergefi-backend's nested TypeORM entity JSON
 * into the flat shapes the UI renders, falling back to mock data (already in
 * the target shape) when the backend is unreachable.
 */
export async function fetchBounties(fallback: Bounty[]): Promise<Bounty[]> {
  try {
    const raw = await request<RawBounty[]>("/bounties");
    return raw.map(adaptBounty);
  } catch {
    return fallback;
  }
}

export async function fetchBounty(
  id: string,
  fallback: Bounty | undefined,
): Promise<Bounty | undefined> {
  try {
    const raw = await request<RawBounty>(`/bounties/${id}`);
    return adaptBounty(raw);
  } catch {
    return fallback;
  }
}

export async function fetchMilestones(fallback: Milestone[]): Promise<Milestone[]> {
  try {
    const raw = await request<RawMilestone[]>("/milestones");
    return raw.map(adaptMilestone);
  } catch {
    return fallback;
  }
}

export async function fetchMaintenancePools(
  fallback: MaintenancePool[],
): Promise<MaintenancePool[]> {
  try {
    const raw = await request<RawMaintenancePool[]>("/maintenance-pools");
    return raw.map(adaptMaintenancePool);
  } catch {
    return fallback;
  }
}

export async function fetchReputationByUsername(
  username: string,
  fallback: ReputationProfile | null,
): Promise<ReputationProfile | null> {
  try {
    const users = await request<(RawUserProfile & { id: string })[]>("/users");
    const user = users.find((u) => u.username === username);
    if (!user) return fallback;
    const snapshot = await request<RawReputationSnapshot | null>(
      `/reputation/${user.id}`,
    );
    return adaptReputation(user, snapshot);
  } catch {
    return fallback;
  }
}

export { request };
