import {
  fetchBounties,
  fetchBounty,
  fetchMilestones,
  fetchMaintenancePools,
  fetchMyRepositories,
  fetchReputationByUsername,
  fetchIndexableReputationHandles,
  fetchPlatformStats,
  type FetchResult,
} from "./api";
import {
  adaptBounty,
  adaptMilestone,
  adaptMaintenancePool,
  adaptReputation,
} from "./adapters";
import { fetchIndexableReputationHandles, fetchMyRepositories } from "./api";
import { ApiUnavailableError, fetchBounty, fetchIndexableReputationHandles } from "./api";
import type { Bounty } from "@/types";

/**
 * The privacy filter in fetchIndexableReputationHandles is the point where a
 * crawlable directory of contributor earnings is prevented from existing at
 * all, so it's tested against the real HTTP path rather than a mock.
 */
describe("fetchIndexableReputationHandles", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  function mockUsersResponse(users: unknown) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => users,
    }) as unknown as typeof fetch;
  }

  it("returns only profiles that explicitly opted in", async () => {
    mockUsersResponse([
      { id: "1", username: "public-priya", isProfilePublic: true },
      { id: "2", username: "private-koda", isProfilePublic: false },
      { id: "3", username: "unspecified-ana" },
      { id: "4", username: "null-flag-marcus", isProfilePublic: null },
    ]);

    const result = await fetchIndexableReputationHandles([]);

    expect(result.source).toBe("live");
    expect(result.data).toEqual(["public-priya"]);
  });

  it("returns nothing when the backend omits the flag entirely", async () => {
    // The current state of mergefi-backend: no isProfilePublic field, so the
    // safe default applies and no profile is submitted for indexing.
    mockUsersResponse([
      { id: "1", username: "a" },
      { id: "2", username: "b" },
    ]);

    const result = await fetchIndexableReputationHandles(["fallback-handle"]);

    expect(result.data).toEqual([]);
  });

  it("drops entries with a blank username", async () => {
    mockUsersResponse([
      { id: "1", username: "", isProfilePublic: true },
      { id: "2", username: "real", isProfilePublic: true },
    ]);

    const result = await fetchIndexableReputationHandles([]);

    expect(result.data).toEqual(["real"]);
  });

  it("falls back to the caller's list when the backend is unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;

    const result = await fetchIndexableReputationHandles(["mock-handle"]);

    expect(result.source).toBe("mock");
    expect(result.data).toEqual(["mock-handle"]);
  });
});

/**
 * The mock-vs-live fallback contract every fetcher implements: any throw from
 * `request` resolves to the caller's fallback with `source: "mock"`, the
 * fallback is returned unmodified, and a successful fetch adapts the raw
 * payload with `source: "live"`.
 */
describe("fetchers — mock-vs-live fallback contract (#941)", () => {
describe("fetchMyRepositories", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
describe("fetchBounty HTTP status handling (#925)", () => {
  const originalFetch = global.fetch;
  const fallback = { id: "b1" } as Bounty;

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const rawBounty = {
    id: "b1",
    amount: "100.5",
    asset: "USDC",
    difficulty: "easy",
    status: "open",
    deadline: null,
    escrowId: "e1",
    issue: {
      number: 7,
      title: "Fix crash",
      body: null,
      labels: ["bug"],
      repository: { owner: "acme", name: "api" },
    },
  } as never;

  const rawMilestone = {
    id: "m1",
    title: "Q1 goals",
    budget: "5000",
    distributed: "1250",
    asset: "USDC",
    status: "open",
    deadline: null,
    repository: { owner: "acme", name: "api" },
    issues: [{ state: "closed" }, { state: "open" }],
  } as never;

  const rawPool = {
    id: "p1",
    name: "Maintenance",
    monthlyDeposit: "200",
    balance: "900",
    asset: "USDC",
    status: "active",
    repository: { owner: "acme", name: "api" },
  } as never;

  const rawUser = {
    id: "u1",
    username: "priya",
    avatarUrl: null,
    isProfilePublic: true,
  } as never;

  const rawSnapshot = {
    totalEarnings: "2500.75",
    mergedPrCount: 12,
    completionRate: "90",
    avgReviewTimeHours: "4.5",
    onTimeDeliveryPercentage: "95",
    languages: { TypeScript: 3 },
    orgsContributedTo: ["acme"],
  } as never;

  const cases = [
    {
      name: "fetchBounties",
      run: (fallback: never) => fetchBounties(fallback),
      fallback: [{ id: "fallback-bounty" }],
      raws: [rawBounty],
      expectedLive: [adaptBounty(rawBounty)],
    },
    {
      name: "fetchBounty",
      run: (fallback: never) => fetchBounty("b1", fallback),
      fallback: { id: "fallback-bounty" },
      raws: [rawBounty],
      expectedLive: adaptBounty(rawBounty),
    },
    {
      name: "fetchMilestones",
      run: (fallback: never) => fetchMilestones(fallback),
      fallback: [{ id: "fallback-milestone" }],
      raws: [rawMilestone],
      expectedLive: [adaptMilestone(rawMilestone)],
    },
    {
      name: "fetchMaintenancePools",
      run: (fallback: never) => fetchMaintenancePools(fallback),
      fallback: [{ id: "fallback-pool" }],
      raws: [rawPool],
      expectedLive: [adaptMaintenancePool(rawPool)],
    },
    {
      name: "fetchMyRepositories",
      run: (fallback: never) => fetchMyRepositories(fallback),
      fallback: [{ org: "fallback", repo: "fallback", url: "" }],
      raws: [[{ id: "r1", org: "acme", name: "api", htmlUrl: "https://github.com/acme/api" }]],
      expectedLive: [{ org: "acme", repo: "api", url: "https://github.com/acme/api" }],
    },
    {
      name: "fetchReputationByUsername",
      run: (fallback: never) => fetchReputationByUsername("priya", fallback),
      fallback: { handle: "fallback-user" },
      raws: [rawUser, rawSnapshot],
      expectedLive: adaptReputation(rawUser, rawSnapshot),
    },
    {
      name: "fetchIndexableReputationHandles",
      run: (fallback: never) => fetchIndexableReputationHandles(fallback),
      fallback: ["fallback-handle"],
      raws: [[{ id: "u1", username: "public-priya", isProfilePublic: true }]],
      expectedLive: ["public-priya"],
    },
    {
      name: "fetchPlatformStats",
      run: (fallback: never) => fetchPlatformStats(fallback),
      fallback: { totalBounties: -1, totalPaidOut: -1, totalRepos: -1 },
      raws: [{ totalBounties: 3, totalPaidOut: 1250.5, totalRepos: 2 }],
      expectedLive: { totalBounties: 3, totalPaidOut: 1250.5, totalRepos: 2 },
    },
  ];

  it("falls back to the unmodified fallback with source 'mock' on any throw, and adapts live responses", async () => {
    for (const c of cases) {
      const fallback = c.fallback as never;

      global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
      let result = await c.run(fallback);
      expect(result.source).toBe("mock");
      expect(result.data).toBe(fallback);

      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 500, statusText: "Server Error" }) as unknown as typeof fetch;
      result = await c.run(fallback);
      expect(result.source).toBe("mock");
      expect(result.data).toBe(fallback);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      }) as unknown as typeof fetch;
      result = await c.run(fallback);
      expect(result.source).toBe("mock");
      expect(result.data).toBe(fallback);

      const mockFetch = jest.fn();
      for (const raw of c.raws) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => raw,
        });
      }
      global.fetch = mockFetch as unknown as typeof fetch;
      result = await c.run(fallback);
      expect(result.source).toBe("live");
      expect(result.data).toEqual(c.expectedLive);
      expect(result.data).not.toBe(fallback);
    }
  it("maps a Repository entity body via RawRepository owner/name (#945)", async () => {
    // Fixture mirrors mergefi-backend Repository entity serialization
    // (src/common/entities/repository.entity.ts): the columns are
    // owner/name — there is no org or htmlUrl field.
    const entity = {
      id: "3f0a2b9c-1111-2222-3333-444455556666",
      githubRepoId: "12345678",
      owner: "acme",
      name: "widgets",
      fullName: "acme/widgets",
      description: null,
      defaultBranch: "main",
      private: false,
      primaryLanguage: "TypeScript",
      stargazersCount: 42,
      maintainer: null,
      maintainerId: null,
      issues: [],
      lastSyncedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [entity],
    }) as unknown as typeof fetch;

    const result = await fetchMyRepositories([]);

    expect(result.source).toBe("live");
    expect(result.data).toEqual([
      {
        org: "acme",
        repo: "widgets",
        url: "https://github.com/acme/widgets",
      },
    ]);
  function mockStatus(status: number) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status,
      statusText: "",
      json: async () => ({}),
    }) as unknown as typeof fetch;
  }

  it("treats a 404 as a real not-found instead of serving mock data", async () => {
    mockStatus(404);

    const result = await fetchBounty("missing", fallback);

    expect(result).toEqual({ data: undefined, source: "live" });
  });

  it("still falls back to mock data on a 5xx", async () => {
    mockStatus(500);

    const result = await fetchBounty("b1", fallback);

    expect(result).toEqual({ data: fallback, source: "mock" });
  });

  it("still falls back to mock data when the backend is unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;

    const result = await fetchBounty("b1", fallback);

    expect(result).toEqual({ data: fallback, source: "mock" });
  });
});

describe("ApiUnavailableError", () => {
  it("carries the HTTP status when one is known", () => {
    expect(new ApiUnavailableError("failed", 404).status).toBe(404);
    expect(new ApiUnavailableError("offline").status).toBeUndefined();
  });
});
