import { cache } from "react";
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
  type RawRepository,
  type RawUserProfile,
} from "./adapters";
import type { Bounty, Milestone, MaintenancePool, ReputationProfile } from "@/types";
import { buildBountyQueryString, type BountyQuery } from "./bounty-query";

export class ApiUnavailableError extends Error {
  // Set only for HTTP responses; undefined for transport (network/timeout/parse) failures.
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: number,
    public code?: string,
  ) {
    super(message);
  }
}

/**
 * Distinguishes live backend data from mock fallback so callers can surface
 * a visible indicator without relying on fragile reference-identity checks.
 */
export interface FetchResult<T> {
  data: T;
  source: "live" | "mock";
}

/**
 * Every caller of `request()` catches the failure and falls back to mock
 * data, so a failed read is an expected, handled condition: it is logged at
 * `warn`, not `error`, so error-level alerting doesn't page on it (#939).
 *
 * A dead backend would otherwise emit one line per fetch per render (and per
 * sitemap chunk a crawler walks). Repeats of the same kind of failure on the
 * same path are suppressed for FETCH_LOG_WINDOW_MS and summarised with a
 * count on the next line logged after the window.
 */
export const FETCH_LOG_WINDOW_MS = 60_000;
const FETCH_LOG_MAX_KEYS = 500;
const fetchLogState = new Map<string, { at: number; suppressed: number }>();

function logFetchError(path: string, kind: "network" | "http" | "parse", detail: string) {
  const key = `${kind} ${path}`;
  const now = Date.now();
  const previous = fetchLogState.get(key);
  if (previous && now - previous.at < FETCH_LOG_WINDOW_MS) {
    previous.suppressed += 1;
    return;
  }
  // Paths include ids and query strings; bound the map so a long-running
  // server can't grow it without limit.
  if (!previous && fetchLogState.size >= FETCH_LOG_MAX_KEYS) fetchLogState.clear();
  fetchLogState.set(key, { at: now, suppressed: 0 });
  const repeats = previous?.suppressed
    ? ` (${previous.suppressed} similar failure${previous.suppressed === 1 ? "" : "s"} suppressed)`
    : "";
  console.warn(`[api] ${kind} error on ${path}: ${detail}${repeats}`);
}

/** Test seam: forgets which failures were already logged. */
export function resetFetchErrorLog(): void {
  fetchLogState.clear();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      logFetchError(path, "network", "Request timed out");
      throw new ApiUnavailableError(`Request to ${path} timed out`);
    }
    logFetchError(path, "network", err instanceof Error ? err.message : String(err));
    throw new ApiUnavailableError(`Network error on ${path}`);
  }
  if (!res.ok) {
    logFetchError(path, "http", `${res.status} ${res.statusText}`);
    throw new ApiUnavailableError(`Request to ${path} failed: ${res.status}`, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch (err) {
    logFetchError(path, "parse", err instanceof Error ? err.message : String(err));
    throw new ApiUnavailableError(`Invalid JSON from ${path}`);
  }
}

const REQUEST_TIMEOUT_MS = 20_000;

// ---------------------------------------------------------------------------
// In-flight request deduplication (#44)
// ---------------------------------------------------------------------------
// Maps a request signature (method + path + body hash) to the in-flight
// Promise so rapid double-clicks on the same mutation coalesce into one
// network request instead of two.

const inflight = new Map<string, Promise<unknown>>();

function requestKey(method: string, path: string, body?: string): string {
  return `${method}:${path}:${body ?? ""}`;
}

async function dedupedFetch<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
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
  const bodyStr = init?.body != null ? String(init.body) : undefined;
  const key = requestKey(init?.method ?? "GET", path, bodyStr);

  return dedupedFetch(key, async () => {
    const token = getToken();
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init?.headers,
        },
        signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        throw new ApiRequestError("Request timed out — please try again.", 0);
      }
      throw err;
    }

    // --- Rate-limit handling (#44) ---
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const seconds = retryAfter ? parseInt(retryAfter, 10) : NaN;
      const waitMsg = Number.isFinite(seconds)
        ? ` Please wait ${seconds} second${seconds === 1 ? "" : "s"} before trying again.`
        : "";
      throw new ApiRequestError(
        `You're doing that too fast.${waitMsg}` || `Rate limited. Please try again later.`,
        429,
        Number.isFinite(seconds) ? seconds : undefined,
      );
    }

    if (!res.ok) {
      const body = await res.text();
      let message = body;
      let code: string | undefined;
      try {
        const parsed = JSON.parse(body);
        // A JSON body without a `.message` (e.g. a NestJS validation error
        // shaped like `{statusCode,error,details}`) must not fall back to the
        // raw JSON text — that would get rendered verbatim in the UI (#187).
        message = parsed.message ?? `Request failed (${res.status})`;
        if (typeof parsed.code === "string") code = parsed.code;
      } catch {
        // plain-text error body, use as-is
      }
      throw new ApiRequestError(message || `Request failed (${res.status})`, res.status, undefined, code);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  });
}

export function apiPost<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
}

/**
 * Live-data fetchers that adapt mergefi-backend's nested TypeORM entity JSON
 * into the flat shapes the UI renders, falling back to mock data (already in
 * the target shape) when the backend is unreachable.
 */
/**
 * `query`, if given, is forwarded to the backend as query params (#28) so
 * this is ready for server-side filtering once `/bounties` supports it —
 * today the backend ignores unknown params and returns the full unfiltered
 * collection, which callers must still run through
 * `applyBountyQuery`/`filterBounties` themselves (see src/lib/bounty-query.ts)
 * to get correct behavior against both live and mock-fallback data.
 */
export const fetchBounties = cache(
  async (
    fallback: Bounty[],
    query?: BountyQuery,
  ): Promise<FetchResult<Bounty[]>> => {
    const qs = query ? buildBountyQueryString(query) : "";
    try {
      const raw = await request<RawBounty[]>(`/bounties${qs}`);
      return { data: raw.map(adaptBounty), source: "live" };
    } catch {
      return { data: fallback, source: "mock" };
    }
  },
);

export const fetchBounty = cache(
  async (
    id: string,
    fallback: Bounty | undefined,
  ): Promise<FetchResult<Bounty | undefined>> => {
    try {
      const raw = await request<RawBounty>(`/bounties/${id}`);
      return { data: adaptBounty(raw), source: "live" };
    } catch (err) {
      // A 404 is the backend answering "no such bounty", not an outage, so
      // it must not be papered over with mock data (#925).
      if (err instanceof ApiUnavailableError && err.status === 404) {
        return { data: undefined, source: "live" };
      }
      return { data: fallback, source: "mock" };
    }
  },
);

export const fetchMilestones = cache(
  async (fallback: Milestone[]): Promise<FetchResult<Milestone[]>> => {
    try {
      const raw = await request<RawMilestone[]>("/milestones");
      return { data: raw.map(adaptMilestone), source: "live" };
    } catch {
      return { data: fallback, source: "mock" };
    }
  },
);

export const fetchMaintenancePools = cache(
  async (fallback: MaintenancePool[]): Promise<FetchResult<MaintenancePool[]>> => {
    try {
      const raw = await request<RawMaintenancePool[]>("/maintenance-pools");
      return { data: raw.map(adaptMaintenancePool), source: "live" };
    } catch {
      return { data: fallback, source: "mock" };
    }
  },
);

export interface MaintainerRepository {
  org: string;
  repo: string;
  url: string;
}

export async function fetchMyRepositories(
  fallback: MaintainerRepository[],
): Promise<FetchResult<MaintainerRepository[]>> {
  try {
    // RawRepository is the single description of the wire format (#945),
    // verified against mergefi-backend's Repository entity: `owner`/`name`,
    // not `org`/`htmlUrl` (neither of those exists on the entity).
    const raw = await request<RawRepository[]>("/repositories/my");
    return {
      data: raw.map((r) => ({
        org: r.owner,
        repo: r.name,
        // The entity has no htmlUrl column; derive the canonical GitHub URL.
        url: `https://github.com/${r.owner}/${r.name}`,
      })),
      source: "live",
    };
  } catch {
    return { data: fallback, source: "mock" };
  }
}
export const fetchMyRepositories = cache(
  async (
    fallback: MaintainerRepository[],
  ): Promise<FetchResult<MaintainerRepository[]>> => {
    try {
      const raw = await request<
        { id: string; org: string; name: string; htmlUrl: string }[]
      >("/repositories/my");
      return {
        data: raw.map((r) => ({
          org: r.org,
          repo: r.name,
          url: r.htmlUrl,
        })),
        source: "live",
      };
    } catch {
      return { data: fallback, source: "mock" };
    }
  },
);

export const fetchReputationByUsername = cache(
  async (
    username: string,
    fallback: ReputationProfile | null,
  ): Promise<FetchResult<ReputationProfile | null>> => {
  try {
    // Prefer the public read path (#597). `GET /users` is JWT-gated and
    // `GET /reputation/:id` is owner-only, so the old pair always 401/403'd
    // for anonymous profile views and fell through to mock data. The
    // by-username endpoint is the intended public lookup; the legacy pair is
    // kept as a secondary attempt for backends that still expose it.
    const target = username.toLowerCase();
    let user: (RawUserProfile & { id: string }) | undefined;
    try {
      user = await request<RawUserProfile & { id: string }>(
        `/users/by-username/${encodeURIComponent(username)}`,
      );
    } catch {
      const users = await request<(RawUserProfile & { id: string })[]>("/users");
      user = users.find((u) => u.username.toLowerCase() === target);
    }
    if (!user?.id) return { data: fallback, source: "mock" };

    let snapshot: RawReputationSnapshot | null = null;
    try {
      snapshot = await request<RawReputationSnapshot | null>(
        `/reputation/${user.id}/latest`,
      );
    } catch {
      try {
        snapshot = await request<RawReputationSnapshot | null>(
          `/reputation/${user.id}`,
        );
      } catch {
        snapshot = null;
      }
    }
    return { data: adaptReputation(user, snapshot), source: "live" };
    } catch {
      return { data: fallback, source: "mock" };
    }
  },
);

/**
 * Handles eligible to appear in the sitemap — i.e. profiles whose owner has
 * opted into search-engine indexing.
 *
 * The filter is the enforcement point for the privacy policy documented in
 * src/lib/seo-policy.ts: without it, calling the /users endpoint to enumerate
 * handles builds a crawlable directory of who earns what, tied to real GitHub
 * identities. Anything other than an explicit `isProfilePublic: true` is
 * excluded, so the endpoint omitting the field (as it does today) means
 * nothing is indexed rather than everything.
 */
export const fetchIndexableReputationHandles = cache(
  async (fallback: string[]): Promise<FetchResult<string[]>> => {
  try {
    const users = await request<(RawUserProfile & { id: string })[]>("/users");
    // The backend's PublicUserDto currently has no isProfilePublic field,
    // so profile indexing is effectively disabled until it ships (#598).
    // Once the backend adds the flag, this filter will start matching.
    const indexable = users
      .filter((user) => user.isProfilePublic === true)
      .map((user) => user.username)
      .filter(Boolean);
    return { data: indexable, source: "live" };
  } catch {
    // The mock fixtures represent contributors who have opted in, so local
    // development exercises the same code path production will take once the
    // backend ships the flag.
    return { data: fallback, source: "mock" };
  }
  },
);

// ---------------------------------------------------------------------------
// Platform analytics (#633)
// ---------------------------------------------------------------------------

export interface PlatformStats {
  totalBounties: number;
  totalPaidOut: number;
  totalRepos: number;
}

export const fetchPlatformStats = cache(
  async (fallback: PlatformStats): Promise<FetchResult<PlatformStats>> => {
    try {
      const raw = await request<{
        totalBounties: number;
        totalPaidOut: number;
        totalRepos: number;
      }>("/analytics/platform");
      return {
        data: {
          totalBounties: raw.totalBounties,
          totalPaidOut: raw.totalPaidOut,
          totalRepos: raw.totalRepos,
        },
        source: "live",
      };
    } catch {
      return { data: fallback, source: "mock" };
    }
  },
);
