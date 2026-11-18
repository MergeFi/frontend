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
