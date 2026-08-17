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
  type RawReputationByUsername,
} from "./adapters";
import type { Bounty, Milestone, MaintenancePool, ReputationProfile } from "@/types";

export class ApiUnavailableError extends Error {}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
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
 */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
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
    throw new ApiRequestError(message || `Request failed (${res.status})`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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

/**
 * Resolves a public contributor profile from its GitHub handle.
 *
 * This used to fetch the *entire* `/users` collection and `.find()` the
 * handle client-side purely to learn the user's id, then fetch that id's
 * snapshot — so every view of `/reputation/[handle]`, including the ones
 * that end in a 404, downloaded the whole user table and got steadily
 * slower as the platform grew. It now issues one request scoped to the
 * single handle, and the backend returns the snapshot along with it.
 *
 * Every unsuccessful outcome resolves to `fallback`, which is exactly what
 * the old implementation did — a `.find()` miss and a failed fetch were
 * both `return fallback`. That keeps the caller's contract intact: the
 * `/reputation/[handle]` page still turns a null fallback into `notFound()`,
 * so an unknown handle 404s as before, just without the full-table fetch.
 * It also means this is safe to deploy ahead of the backend endpoint (see
 * PR notes) — an unrecognised route 404s and falls back to mock data,
 * which is the behaviour the JWT-guarded `/users` call already produced
 * from this unauthenticated server-side caller.
 *
 * Matching stays exact and case-sensitive: `users.username` is a plain
 * unique varchar, so the backend's lookup has the same semantics the old
 * `u.username === username` comparison did. `encodeURIComponent` keeps a
 * handle containing `/`, `?` or `..` confined to one path segment rather
 * than letting it reshape the request URL.
 */
export async function fetchReputationByUsername(
  username: string,
  fallback: ReputationProfile | null,
): Promise<ReputationProfile | null> {
  try {
    const { user, snapshot } = await request<RawReputationByUsername>(
      `/reputation/by-username/${encodeURIComponent(username)}`,
    );
    return adaptReputation(user, snapshot);
  } catch {
    return fallback;
  }
}

export { request };
