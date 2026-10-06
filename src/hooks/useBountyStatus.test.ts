import { renderHook, act } from "@testing-library/react";
import { useBountyStatus } from "./useBountyStatus";
import { fetchBountyLive } from "@/lib/api";
import type { Bounty } from "@/types/bounty";

jest.mock("@/lib/api", () => ({
  fetchBountyLive: jest.fn(),
  fetchBounty: jest.fn(),
}));

const mockFetchBountyLive = fetchBountyLive as jest.MockedFunction<typeof fetchBountyLive>;

const fallbackBounty: Bounty = {
  id: "bounty-1",
  title: "Test Bounty",
  description: "Initial description",
  status: "open",
  rewardAmount: "100",
  rewardToken: "USDC",
  creatorAddress: "GCREATOR",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const liveClaimedBounty: Bounty = {
  ...fallbackBounty,
  status: "claimed",
  claimedBy: "alice",
};

describe("useBountyStatus (#571)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("retains last live data, sets error, and does not fire false onStatusChange on transient poll failure", async () => {
    const onStatusChange = jest.fn();

    // 1. First poll succeeds with live data (claimed)
    mockFetchBountyLive.mockResolvedValueOnce({
      data: liveClaimedBounty,
      source: "live",
    });

    const { result } = renderHook(() =>
      useBountyStatus({
        bountyId: "bounty-1",
        fallbackBounty,
        interval: 3000,
        onStatusChange,
      }),
    );

    // Let the first poll resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe("claimed");
    expect(result.current.bounty?.claimedBy).toBe("alice");
    expect(result.current.source).toBe("live");
    expect(result.current.error).toBeNull();
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenLastCalledWith("claimed");

    // 2. Next poll suffers a transient network failure mid-session
    const networkError = new Error("Network request failed: 503 Service Unavailable");
    mockFetchBountyLive.mockRejectedValueOnce(networkError);

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    // 3. Assertions:
    // - status must still be claimed (not swapped back to fallback "open")
    expect(result.current.status).toBe("claimed");
    expect(result.current.bounty?.claimedBy).toBe("alice");
    expect(result.current.source).toBe("live");
    // - error must be surfaced so UI can render retry prompt
    expect(result.current.error).toEqual(networkError);
    // - onStatusChange must NOT be called with the stale fallback status
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).not.toHaveBeenCalledWith("open");
  });

  it("uses fallbackBounty on initial load when live fetch fails immediately", async () => {
    const onStatusChange = jest.fn();
    mockFetchBountyLive.mockRejectedValueOnce(new Error("Initial offline"));

    const { result } = renderHook(() =>
      useBountyStatus({
        bountyId: "bounty-1",
        fallbackBounty,
        onStatusChange,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe("open");
    expect(result.current.source).toBe("mock");
    expect(result.current.bounty?.id).toBe("bounty-1");
    expect(result.current.error).toBeNull();
    expect(onStatusChange).toHaveBeenCalledWith("open");
  });
});
