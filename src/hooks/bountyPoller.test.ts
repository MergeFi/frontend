/**
 * bountyPoller.test.ts (#909)
 *
 * The shared, module-level subscription registry behind every bounty page:
 * one fetch loop per bounty id, the lowest subscriber interval wins, the last
 * unsubscribe stops the timer, and a terminal status stops polling.
 */

import { fetchBounty } from "@/lib/api";
import type { Bounty } from "@/types/bounty";
import {
  __resetRegistry,
  getBountySnapshot,
  refetchBounty,
  subscribeBounty,
} from "./bountyPoller";

jest.mock("@/lib/api", () => ({ fetchBounty: jest.fn() }));

const mockFetchBounty = fetchBounty as jest.MockedFunction<typeof fetchBounty>;

function bounty(status: Bounty["status"]): Bounty {
  return { id: "b1", status } as Bounty;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockFetchBounty.mockReset();
  mockFetchBounty.mockResolvedValue({ data: bounty("open"), source: "live" });
});

afterEach(() => {
  __resetRegistry();
  jest.useRealTimers();
});

describe("bountyPoller", () => {
  it("returns empty defaults for an id nobody subscribed to", () => {
    expect(getBountySnapshot("nobody")).toEqual({
      bounty: null,
      source: null,
      loading: false,
      error: null,
    });
  });

  it("shares one fetch loop between subscribers of the same bounty", async () => {
    subscribeBounty("b1", jest.fn(), 5000);
    subscribeBounty("b1", jest.fn(), 5000);

    await jest.advanceTimersByTimeAsync(5000);

    expect(mockFetchBounty).toHaveBeenCalledTimes(1);
  });

  it("switches the shared loop to the lowest subscriber interval", async () => {
    subscribeBounty("b1", jest.fn(), 5000);
    subscribeBounty("b1", jest.fn(), 1000);
    const afterRestart = mockFetchBounty.mock.calls.length;

    await jest.advanceTimersByTimeAsync(1000);

    expect(mockFetchBounty.mock.calls.length).toBe(afterRestart + 1);
  });

  it("stops the timer when the last subscriber unsubscribes", async () => {
    const unsubscribeA = subscribeBounty("b1", jest.fn(), 1000);
    const unsubscribeB = subscribeBounty("b1", jest.fn(), 1000);
    unsubscribeA();
    unsubscribeB();
    mockFetchBounty.mockClear();

    await jest.advanceTimersByTimeAsync(10_000);

    expect(mockFetchBounty).not.toHaveBeenCalled();
  });

  it("stops polling once a terminal status is observed", async () => {
    mockFetchBounty.mockResolvedValue({ data: bounty("paid"), source: "live" });
    subscribeBounty("b1", jest.fn(), 1000);

    await jest.advanceTimersByTimeAsync(1000);
    const callsAtTerminal = mockFetchBounty.mock.calls.length;
    await jest.advanceTimersByTimeAsync(10_000);

    expect(callsAtTerminal).toBeGreaterThan(0);
    expect(mockFetchBounty.mock.calls.length).toBe(callsAtTerminal);
  });

  it("publishes the fetched bounty to the snapshot and notifies listeners", async () => {
    const listener = jest.fn();
    subscribeBounty("b1", listener, 1000);

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(0);

    expect(getBountySnapshot("b1")).toMatchObject({
      bounty: { id: "b1", status: "open" },
      source: "live",
      loading: false,
      error: null,
    });
    expect(listener).toHaveBeenCalled();
  });

  it("records a fetch failure on the snapshot instead of throwing", async () => {
    mockFetchBounty.mockRejectedValue(new Error("backend down"));
    subscribeBounty("b1", jest.fn(), 1000);

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(0);

    const snapshot = getBountySnapshot("b1");
    expect(snapshot.error).toBeInstanceOf(Error);
    expect(snapshot.error?.message).toBe("backend down");
    expect(snapshot.loading).toBe(false);
  });

  it("refetches immediately when asked while a poller is running", async () => {
    subscribeBounty("b1", jest.fn(), 5000);
    await jest.advanceTimersByTimeAsync(5000);
    const before = mockFetchBounty.mock.calls.length;

    refetchBounty("b1");
    await jest.advanceTimersByTimeAsync(0);

    expect(mockFetchBounty.mock.calls.length).toBe(before + 1);
  });

  it("isolates registry state between tests through the reset seam", async () => {
    subscribeBounty("b1", jest.fn(), 1000);
    __resetRegistry();
    mockFetchBounty.mockClear();

    await jest.advanceTimersByTimeAsync(10_000);

    expect(mockFetchBounty).not.toHaveBeenCalled();
    expect(getBountySnapshot("b1").bounty).toBeNull();
  });
});
