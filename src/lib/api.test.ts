import { apiPost, apiRequest, fetchIndexableReputationHandles } from "./api";

describe("apiRequest in-flight deduplication and Idempotency-Key (#869)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("does not coalesce concurrent requests with distinct Idempotency-Key headers", async () => {
    let resolveFirst!: (value: unknown) => void;
    let resolveSecond!: (value: unknown) => void;

    const firstResponse = new Promise((res) => {
      resolveFirst = res;
    });
    const secondResponse = new Promise((res) => {
      resolveSecond = res;
    });

    const fetchMock = jest
      .fn()
      .mockReturnValueOnce(firstResponse)
      .mockReturnValueOnce(secondResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    const req1 = apiPost("/bounties/b1/claim", {}, "key-attempt-1");
    const req2 = apiPost("/bounties/b1/claim", {}, "key-attempt-2");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      "Idempotency-Key": "key-attempt-1",
    });
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      "Idempotency-Key": "key-attempt-2",
    });

    resolveFirst({ ok: true, status: 200, json: async () => ({ attempt: 1 }) });
    resolveSecond({ ok: true, status: 200, json: async () => ({ attempt: 2 }) });

    await expect(req1).resolves.toEqual({ attempt: 1 });
    await expect(req2).resolves.toEqual({ attempt: 2 });
  });

  it("still coalesces concurrent requests that share the same Idempotency-Key", async () => {
    let resolveCall!: (value: unknown) => void;
    const pending = new Promise((res) => {
      resolveCall = res;
    });
    const fetchMock = jest.fn().mockReturnValueOnce(pending);
    global.fetch = fetchMock as unknown as typeof fetch;

    const req1 = apiPost("/bounties/b1/claim", {}, "same-key");
    const req2 = apiPost("/bounties/b1/claim", {}, "same-key");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveCall({ ok: true, status: 200, json: async () => ({ ok: true }) });

    await expect(Promise.all([req1, req2])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);
  });

  it("recognizes Idempotency-Key passed via a Headers instance", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const h1 = new Headers({ "Idempotency-Key": "headers-key-1" });
    const h2 = new Headers({ "Idempotency-Key": "headers-key-2" });

    await Promise.all([
      apiRequest("/bounties/b1/claim", { method: "POST", body: "{}", headers: h1 }),
      apiRequest("/bounties/b1/claim", { method: "POST", body: "{}", headers: h2 }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("recognizes Idempotency-Key passed via header entry tuples", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await Promise.all([
      apiRequest("/bounties/b1/claim", {
        method: "POST",
        body: "{}",
        headers: [["Idempotency-Key", "tuple-key-1"]],
      }),
      apiRequest("/bounties/b1/claim", {
        method: "POST",
        body: "{}",
        headers: [["Idempotency-Key", "tuple-key-2"]],
      }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

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
