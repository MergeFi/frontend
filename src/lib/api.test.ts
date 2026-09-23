import {
  fetchBounties,
  fetchBounty,
  apiRequest,
  ApiRequestError,
  REQUEST_TIMEOUT_MS,
} from "./api";
import type { Bounty } from "@/types";

describe("api helper with timeout and fallback (Issue #351)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  const mockFallbackBounties: Bounty[] = [
    {
      id: "mock-1",
      title: "Fallback Bounty",
      description: "Fallback Description",
      reward: 100,
      asset: "USDC",
      difficulty: "beginner",
      status: "open",
      org: "owner",
      repo: "owner/repo",
      issueNumber: 1,
      labels: ["fallback"],
      deadline: null,
    },
  ];

  it("exports REQUEST_TIMEOUT_MS configured to 20_000ms", () => {
    expect(REQUEST_TIMEOUT_MS).toBe(20_000);
  });

  it("returns live data when server request succeeds", async () => {
    const rawApiBounty = {
      id: "live-1",
      title: "Live Bounty",
      description: "Live Description",
      amount: "250",
      token_symbol: "USDC",
      status: "OPEN",
      github_repo: "owner/repo",
      github_issue_number: 10,
      created_at: new Date().toISOString(),
      tags: ["stellar"],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [rawApiBounty],
    } as unknown as Response);

    const result = await fetchBounties(mockFallbackBounties);
    expect(result.source).toBe("live");
    expect(result.data.length).toBe(1);
    expect(result.data[0].id).toBe("live-1");
  });

  it("falls back to mock data gracefully when request times out (TimeoutError)", async () => {
    const timeoutErr = new Error("The operation was aborted due to timeout");
    timeoutErr.name = "TimeoutError";

    global.fetch = jest.fn().mockRejectedValue(timeoutErr);

    const result = await fetchBounties(mockFallbackBounties);
    expect(result.source).toBe("mock");
    expect(result.data).toEqual(mockFallbackBounties);
  });

  it("falls back to mock data gracefully on generic network error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Failed to fetch"));

    const result = await fetchBounties(mockFallbackBounties);
    expect(result.source).toBe("mock");
    expect(result.data).toEqual(mockFallbackBounties);
  });

  it("falls back to mock data gracefully on 500 server error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as unknown as Response);

    const result = await fetchBounties(mockFallbackBounties);
    expect(result.source).toBe("mock");
    expect(result.data).toEqual(mockFallbackBounties);
  });

  it("fetchBounty falls back to mock data on timeout", async () => {
    const timeoutErr = new Error("The operation was aborted due to timeout");
    timeoutErr.name = "TimeoutError";

    global.fetch = jest.fn().mockRejectedValue(timeoutErr);

    const result = await fetchBounty("missing-id", mockFallbackBounties[0]);
    expect(result.source).toBe("mock");
    expect(result.data).toEqual(mockFallbackBounties[0]);
  });

  it("apiRequest throws ApiRequestError on timeout", async () => {
    const domTimeout = new DOMException("The operation timed out.", "TimeoutError");
    global.fetch = jest.fn().mockRejectedValue(domTimeout);

    await expect(apiRequest("/mutate")).rejects.toThrow(ApiRequestError);
    await expect(apiRequest("/mutate")).rejects.toThrow("Request timed out");
  });
});
