import * as React from "react";
import { act, renderHook } from "@testing-library/react";
import { useClaimRace } from "./useClaimRace";
import { apiPost, fetchBounty } from "@/lib/api";
import { adaptBounty, type RawBounty } from "@/lib/adapters";
import type { Bounty } from "@/types/bounty";

// Pass-through useState so tests can observe setter calls (see trackSetStateCalls).
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, useState: jest.fn(actual.useState) };
});
const realUseState: typeof React.useState = jest.requireActual("react").useState;
const mockUseState = React.useState as unknown as jest.Mock;

jest.mock("@/lib/api", () => ({
  apiPost: jest.fn(),
  fetchBounty: jest.fn(),
}));

jest.mock("@/lib/adapters", () => ({
  adaptBounty: jest.fn((raw: unknown) => ({ ...(raw as object), adapted: true })),
}));

const mockApiPost = apiPost as jest.MockedFunction<typeof apiPost>;
const mockFetchBounty = fetchBounty as jest.MockedFunction<typeof fetchBounty>;
const mockAdaptBounty = adaptBounty as jest.MockedFunction<typeof adaptBounty>;

const rawBounty: RawBounty = {
  id: "b1",
  amount: "100.00",
  asset: "USDC",
  difficulty: "intermediate",
  status: "open",
  deadline: null,
  escrowId: "escrow_123",
};

const adaptedBounty = {
  ...rawBounty,
  adapted: true,
} as unknown as Bounty;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function trackSetStateCalls() {
  const calls: { mounted: boolean }[] = [];
  const state = { mounted: true };
  mockUseState.mockImplementation(((initial: unknown) => {
    const [value, setValue] = realUseState(initial);
    const tracked = (next: unknown) => {
      calls.push({ mounted: state.mounted });
      setValue(next);
    };
    return [value, tracked];
  }) as typeof React.useState);
  return { calls, state };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAdaptBounty.mockImplementation((raw: unknown) => ({ ...(raw as object), adapted: true } as Bounty));
});
afterEach(() => mockUseState.mockImplementation(realUseState));

describe("useClaimRace (mounted) - Overkill Test Shield", () => {
  it("happy path: records a successful claim and calls onClaimSuccess with adapted bounty entity", async () => {
    // Backend returns raw entity directly, NOT wrapped in { data: bounty }
    mockApiPost.mockResolvedValueOnce(rawBounty);
    const onClaimSuccess = jest.fn();
    const { result } = renderHook(() => useClaimRace("b1", onClaimSuccess));

    let returned;
    await act(async () => {
      returned = await result.current.claim();
    });

    expect(mockApiPost).toHaveBeenCalledWith("/bounties/b1/claim", {});
    expect(mockAdaptBounty).toHaveBeenCalledWith(rawBounty);
    expect(returned).toEqual({ success: true, bounty: adaptedBounty });
    expect(result.current.lastResult).toEqual({ success: true, bounty: adaptedBounty });
    expect(result.current.isClaiming).toBe(false);
    expect(onClaimSuccess).toHaveBeenCalledWith(adaptedBounty);
  });

  it("unhappy path: maps 409 conflict to ALREADY_CLAIMED with refreshed bounty", async () => {
    mockApiPost.mockRejectedValueOnce({ status: 409, message: "already claimed by another user" });
    mockFetchBounty.mockResolvedValueOnce({ data: adaptedBounty } as never);
    const { result } = renderHook(() => useClaimRace("b1"));

    let returned;
    await act(async () => {
      returned = await result.current.claim();
    });

    expect(returned).toEqual({
      success: false,
      error: "ALREADY_CLAIMED",
      bounty: adaptedBounty,
    });
    expect(result.current.lastResult).toEqual({
      success: false,
      error: "ALREADY_CLAIMED",
      bounty: adaptedBounty,
    });
  });

  it("unhappy path: maps 409 conflict when fetchBounty fails gracefully", async () => {
    mockApiPost.mockRejectedValueOnce({ status: 409, message: "already claimed" });
    mockFetchBounty.mockRejectedValueOnce(new Error("network error on refresh"));
    const { result } = renderHook(() => useClaimRace("b1"));

    let returned;
    await act(async () => {
      returned = await result.current.claim();
    });

    expect(returned).toEqual({
      success: false,
      error: "ALREADY_CLAIMED",
    });
  });

  it("unhappy path: maps server error 500 to NETWORK_ERROR", async () => {
    mockApiPost.mockRejectedValueOnce({ status: 500, message: "internal server error" });
    const { result } = renderHook(() => useClaimRace("b1"));

    let returned;
    await act(async () => {
      returned = await result.current.claim();
    });

    expect(returned).toEqual({
      success: false,
      error: "NETWORK_ERROR",
      message: "internal server error",
    });
    expect(result.current.isClaiming).toBe(false);
  });

  it("reset clears the lastResult state", async () => {
    mockApiPost.mockResolvedValueOnce(rawBounty);
    const { result } = renderHook(() => useClaimRace("b1"));

    await act(async () => {
      await result.current.claim();
    });

    expect(result.current.lastResult).not.toBeNull();
    act(() => {
      result.current.reset();
    });
    expect(result.current.lastResult).toBeNull();
  });
});

describe("useClaimRace — unmount while a claim is in flight (#361)", () => {
  it("success: no state updates or onClaimSuccess after unmount, but claim() still resolves", async () => {
    const { calls, state } = trackSetStateCalls();
    const pending = deferred<RawBounty>();
    mockApiPost.mockReturnValueOnce(pending.promise);
    const onClaimSuccess = jest.fn();
    const { result, unmount } = renderHook(() => useClaimRace("b1", onClaimSuccess));

    let claimPromise!: Promise<unknown>;
    act(() => {
      claimPromise = result.current.claim();
    });
    unmount();
    state.mounted = false;

    pending.resolve(rawBounty);
    await expect(claimPromise).resolves.toEqual({ success: true, bounty: adaptedBounty });

    expect(calls.filter((c) => !c.mounted)).toHaveLength(0);
    expect(onClaimSuccess).not.toHaveBeenCalled();
  });
});
