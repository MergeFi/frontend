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
export interface BountyFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  difficulty?: string;
  asset?: string;
  sort?: "reward_asc" | "reward_desc" | "deadline_asc" | "deadline_desc";
  search?: string;
}

/**
 * Build query string from filter params for the bounty board (Issue #28).
 * Backend contract note: GET /bounties should accept these as query params.
 * If backend doesn't support them yet, mock-data fallback handles filtering.
 */
function buildBountyQueryString(filters: BountyFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.status) params.set("status", filters.status);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.asset) params.set("asset", filters.asset);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export interface PaginatedBounties {
  items: Bounty[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchBounties(
  fallback: Bounty[],
  filters: BountyFilters = {},
): Promise<PaginatedBounties> {
  try {
    const qs = buildBountyQueryString(filters);
    const raw = await request<RawBounty[]>(`/bounties${qs}`);
    const items = raw.map(adaptBounty);
    return {
      items,
      total: items.length, // Backend should return total count; using length as interim
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    };
  } catch {
    // Fallback: apply filters in-memory against mock data
    return filterMockBounties(fallback, filters);
  }
}

/**
 * In-memory filter/sort/paginate for mock data parity (Issue #28).
 * Ensures demos work fully offline with the same filtering behavior.
 */
function filterMockBounties(
  bounties: Bounty[],
  filters: BountyFilters,
): PaginatedBounties {
  let filtered = [...bounties];

  if (filters.status) {
    filtered = filtered.filter((b) => b.status === filters.status);
  }
  if (filters.difficulty) {
    filtered = filtered.filter((b) => b.difficulty === filters.difficulty);
  }
  if (filters.asset) {
    filtered = filtered.filter((b) => b.asset === filters.asset);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.repo.toLowerCase().includes(q) ||
        b.labels.some((l) => l.toLowerCase().includes(q)),
    );
  }

  if (filters.sort) {
    switch (filters.sort) {
      case "reward_asc":
        filtered.sort((a, b) => a.reward - b.reward);
        break;
      case "reward_desc":
        filtered.sort((a, b) => b.reward - a.reward);
        break;
      case "deadline_asc":
        filtered.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        break;
      case "deadline_desc":
        filtered.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
        break;
    }
  }

  const total = filtered.length;
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, page, pageSize };
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
