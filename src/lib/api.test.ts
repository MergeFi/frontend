import { fetchIndexableReputationHandles, parseRetryAfter, apiRequest } from "./api";

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

describe("parseRetryAfter and 429 handling (#572)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("parseRetryAfter", () => {
    // Import helper dynamically or directly

    it("parses delay-seconds correctly", () => {
      expect(parseRetryAfter("30")).toBe(30);
      expect(parseRetryAfter("1")).toBe(1);
      expect(parseRetryAfter("0")).toBe(0);
      expect(parseRetryAfter(" 45 ")).toBe(45);
    });

    it("parses HTTP-date form correctly", () => {
      const now = 1700000000000;
      jest.spyOn(Date, "now").mockReturnValue(now);

      // 60 seconds into the future
      const targetDate = new Date(now + 60000).toUTCString();
      expect(parseRetryAfter(targetDate)).toBe(60);

      // Past date clamps to 0
      const pastDate = new Date(now - 10000).toUTCString();
      expect(parseRetryAfter(pastDate)).toBe(0);
    });

    it("returns undefined for null, undefined, empty, or garbage values", () => {
      expect(parseRetryAfter(null)).toBeUndefined();
      expect(parseRetryAfter(undefined)).toBeUndefined();
      expect(parseRetryAfter("")).toBeUndefined();
      expect(parseRetryAfter("   ")).toBeUndefined();
      expect(parseRetryAfter("invalid-date-string")).toBeUndefined();
    });
  });

  describe("apiRequest 429 response", () => {

    it("constructs wait message and sets retryAfter for delay-seconds", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 429,
        ok: false,
        headers: new Headers({ "Retry-After": "10" }),
      });

      await expect(apiRequest("/test")).rejects.toMatchObject({
        name: "Error",
        status: 429,
        retryAfter: 10,
        message: "You're doing that too fast. Please wait 10 seconds before trying again.",
      });
    });

    it("uses singular 'second' when delay is 1", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 429,
        ok: false,
        headers: new Headers({ "Retry-After": "1" }),
      });

      await expect(apiRequest("/test")).rejects.toMatchObject({
        status: 429,
        retryAfter: 1,
        message: "You're doing that too fast. Please wait 1 second before trying again.",
      });
    });

    it("constructs wait message and sets retryAfter for HTTP-date", async () => {
      const now = 1700000000000;
      jest.spyOn(Date, "now").mockReturnValue(now);
      const httpDate = new Date(now + 25000).toUTCString();

      global.fetch = jest.fn().mockResolvedValue({
        status: 429,
        ok: false,
        headers: new Headers({ "Retry-After": httpDate }),
      });

      await expect(apiRequest("/test")).rejects.toMatchObject({
        status: 429,
        retryAfter: 25,
        message: "You're doing that too fast. Please wait 25 seconds before trying again.",
      });
    });

    it("falls back to generic message when Retry-After is absent", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 429,
        ok: false,
        headers: new Headers(),
      });

      await expect(apiRequest("/test")).rejects.toMatchObject({
        status: 429,
        retryAfter: undefined,
        message: "Rate limited. Please try again later.",
      });
    });

    it("falls back to generic message when Retry-After contains garbage", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 429,
        ok: false,
        headers: new Headers({ "Retry-After": "not-a-number-or-date" }),
      });

      await expect(apiRequest("/test")).rejects.toMatchObject({
        status: 429,
        retryAfter: undefined,
        message: "Rate limited. Please try again later.",
      });
    });
  });
});
