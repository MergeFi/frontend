/**
 * Covers the username -> reputation lookup behind every /reputation/[handle]
 * view. The regression worth guarding is the original implementation, which
 * fetched the entire unfiltered `/users` collection and scanned it in memory
 * just to translate a handle into an id — a cost paid on every render,
 * including renders that ended in a 404, and one that grew with the user
 * table rather than with traffic.
 */

// api.ts -> config.ts calls loadValidatedEnv() at module scope, which throws
// when NEXT_PUBLIC_STELLAR_NETWORK is unset. Stub the resolved values so
// these tests exercise the fetcher, not env validation (env.ts has its own).
jest.mock("./config", () => ({
  API_BASE_URL: "http://api.test",
  GITHUB_OAUTH_URL: "http://api.test/auth/github",
  STELLAR_NETWORK: "TESTNET",
}));

import { fetchReputationByUsername } from "./api";
import type { ReputationProfile } from "@/types";

const RAW_USER = { username: "priyaeth", avatarUrl: null };

const RAW_SNAPSHOT = {
  totalEarnings: "8420.00",
  mergedPrCount: 61,
  completionRate: "94.0",
  avgReviewTimeHours: "14.0",
  onTimeDeliveryPercentage: "88.0",
  languages: { Rust: 12, TypeScript: 5 },
  orgsContributedTo: ["stellar-labs", "mergefi"],
};

const FALLBACK: ReputationProfile = {
  handle: "priyaeth",
  avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  lifetimeEarnings: 1,
  mergedPRs: 1,
  completionRate: 0.5,
  avgReviewTimeHours: 1,
  onTimeDeliveryRate: 0.5,
  languages: ["Rust"],
  organizations: ["mergefi"],
  topClients: [],
};

let fetchMock: jest.Mock;

/** The URL string every fetch() call was made with, in order. */
const requestedUrls = () => fetchMock.mock.calls.map((call) => String(call[0]));

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("fetchReputationByUsername", () => {
  it("resolves a handle with one request scoped to that handle", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: RAW_USER, snapshot: RAW_SNAPSHOT }),
    });

    await fetchReputationByUsername("priyaeth", null);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrls()[0]).toContain("priyaeth");
  });

  it("never requests the unfiltered /users collection", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: RAW_USER, snapshot: RAW_SNAPSHOT }),
    });

    await fetchReputationByUsername("priyaeth", null);

    // The old code's first call was a bare "/users" — no path parameter, no
    // query string. Assert against exactly that, so a legitimately scoped
    // "/users/by-username/x" or "/users?username=x" would still pass if the
    // lookup is ever moved back under the users resource.
    for (const url of requestedUrls()) {
      const { pathname, search } = new URL(url);
      expect(pathname === "/users" && search === "").toBe(false);
    }
  });

  it("adapts the combined payload into a profile", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: RAW_USER, snapshot: RAW_SNAPSHOT }),
    });

    const profile = await fetchReputationByUsername("priyaeth", null);

    expect(profile).toMatchObject({
      handle: "priyaeth",
      lifetimeEarnings: 8420,
      mergedPRs: 61,
      completionRate: 0.94,
      onTimeDeliveryRate: 0.88,
      languages: ["Rust", "TypeScript"],
      organizations: ["stellar-labs", "mergefi"],
    });
  });

  it("still returns a profile for a real user with no snapshot yet", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: RAW_USER, snapshot: null }),
    });

    const profile = await fetchReputationByUsername("priyaeth", null);

    expect(profile).toMatchObject({ handle: "priyaeth", mergedPRs: 0, lifetimeEarnings: 0 });
  });

  it("falls back to mock data when the backend is unreachable", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(fetchReputationByUsername("priyaeth", FALLBACK)).resolves.toBe(FALLBACK);
  });

  it("falls back when the backend does not know the handle", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    // Same resolution the old `.find()` miss produced (`return fallback`),
    // so live-vs-mock behaviour is unchanged for the caller.
    await expect(fetchReputationByUsername("priyaeth", FALLBACK)).resolves.toBe(FALLBACK);
  });

  it("resolves an unknown handle with no mock to null, after one scoped request", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    // null is what makes the page notFound(). The point of this case is the
    // request count: concluding "no such user" must not cost a full table.
    await expect(fetchReputationByUsername("ghost-handle", null)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrls()[0]).toContain("ghost-handle");
  });

  it("preserves the handle's casing rather than normalising it", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    // GitHub handles are stored with their original casing and the backend
    // column is a plain varchar, so the old exact-match `.find()` was
    // case-sensitive; sending a lowercased handle would silently 404 a
    // profile that used to resolve.
    await fetchReputationByUsername("PriyaEth", null);

    expect(requestedUrls()[0]).toContain("PriyaEth");
  });

  it("keeps a handle with URL-significant characters inside one path segment", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    await fetchReputationByUsername("../../users", null);

    const { pathname } = new URL(requestedUrls()[0]);
    expect(pathname).toBe("/reputation/by-username/..%2F..%2Fusers");
  });
});
