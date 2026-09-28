import { fetchIndexableReputationHandles, apiRequest, ApiRequestError } from "./api";

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

describe("apiRequest 429 rate-limit handling (#572)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  // Mirrors the shape of a real fetch Response for the 429 branch; the body is
  // never read in that path because apiRequest throws before reaching res.text().
  function mock429(retryAfter: string | null) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      headers: {
        get: (h: string) => (h.toLowerCase() === "retry-after" ? retryAfter : null),
      },
      json: async () => ({}),
    }) as unknown as typeof fetch;
  }

  it("parses a delay-seconds Retry-After and surfaces retryAfter to callers", async () => {
    mock429("120");
    let caught: unknown;
    try {
      await apiRequest("/r572-seconds");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiRequestError);
    const e = caught as ApiRequestError;
    expect(e.status).toBe(429);
    expect(e.retryAfter).toBe(120);
    expect(e.message).toBe(
      "You're doing that too fast. Please wait 120 seconds before trying again.",
    );
  });

  it("parses an HTTP-date Retry-After (RFC 9110 §10.2.3) into seconds", async () => {
    const future = new Date(Date.now() + 90_000).toUTCString();
    mock429(future);
    let caught: unknown;
    try {
      await apiRequest("/r572-httpdate");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiRequestError);
    const e = caught as ApiRequestError;
    expect(e.status).toBe(429);
    expect(Number.isFinite(e.retryAfter)).toBe(true);
    expect(e.retryAfter).toBeGreaterThan(0);
    expect(e.retryAfter).toBeLessThanOrEqual(95);
  });

  it("uses the plain fallback message when Retry-After is missing", async () => {
    mock429(null);
    let caught: unknown;
    try {
      await apiRequest("/r572-missing");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiRequestError);
    const e = caught as ApiRequestError;
    expect(e.retryAfter).toBeUndefined();
    expect(e.message).toBe(
      "You're doing that too fast. Rate limited. Please try again later.",
    );
  });

  it("treats a garbage Retry-After as missing rather than NaN", async () => {
    mock429("not-a-number");
    let caught: unknown;
    try {
      await apiRequest("/r572-garbage");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiRequestError);
    const e = caught as ApiRequestError;
    expect(e.retryAfter).toBeUndefined();
    expect(e.message).toContain("Rate limited. Please try again later.");
  });
});
