import { fetchMilestones, FETCH_LOG_WINDOW_MS, resetFetchErrorLog } from "./api";

/**
 * #939 — a failed read is handled (callers fall back to mock data), so it is
 * logged at `warn`, and a backend outage doesn't flood the logs with one line
 * per fetch.
 */
describe("fetch failure logging (#939)", () => {
  const originalFetch = global.fetch;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  let now: jest.SpyInstance;

  beforeEach(() => {
    resetFetchErrorLog();
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    error = jest.spyOn(console, "error").mockImplementation(() => {});
    now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("logs a handled fallback at warn, not error", async () => {
    const result = await fetchMilestones([]);

    expect(result.source).toBe("mock");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("[api] network error on /milestones");
    expect(error).not.toHaveBeenCalled();
  });

  it("suppresses repeats of the same failure within the window", async () => {
    await fetchMilestones([]);
    await fetchMilestones([]);
    await fetchMilestones([]);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("logs again after the window, with a count of what was suppressed", async () => {
    await fetchMilestones([]);
    await fetchMilestones([]);
    await fetchMilestones([]);
    now.mockReturnValue(1_000_000 + FETCH_LOG_WINDOW_MS);
    await fetchMilestones([]);

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1][0]).toContain("(2 similar failures suppressed)");
  });
});
