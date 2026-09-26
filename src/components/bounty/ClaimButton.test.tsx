import { act, render, screen, fireEvent } from "@testing-library/react";
import { ClaimButton } from "./ClaimButton";
import { useClaimRace } from "@/hooks/useClaimRace";
import { useBountyStatus } from "@/hooks/useBountyStatus";

jest.mock("@/hooks/useClaimRace", () => ({ useClaimRace: jest.fn() }));
jest.mock("@/hooks/useBountyStatus", () => ({ useBountyStatus: jest.fn() }));

const mockUseClaimRace = useClaimRace as jest.MockedFunction<typeof useClaimRace>;
const mockUseBountyStatus = useBountyStatus as jest.MockedFunction<typeof useBountyStatus>;

// Stable references: the component's effect depends on refetch/reset, so new
// functions per render would re-run it and reset the auto-dismiss timers.
const claim = jest.fn().mockResolvedValue(undefined);
const reset = jest.fn();
const refetch = jest.fn();

type ClaimOverrides = { isClaiming?: boolean; lastResult?: unknown };
type StatusOverrides = { status?: string; bounty?: unknown; isPolling?: boolean };

function mockHooks(claimState: ClaimOverrides = {}, statusState: StatusOverrides = {}) {
  mockUseClaimRace.mockReturnValue({
    claim,
    reset,
    isClaiming: false,
    lastResult: null,
    ...claimState,
  } as unknown as ReturnType<typeof useClaimRace>);
  mockUseBountyStatus.mockReturnValue({
    bounty: { id: "b1", status: "open" },
    refetch,
    status: "open",
    isPolling: false,
    ...statusState,
  } as unknown as ReturnType<typeof useBountyStatus>);
}

const RACE_TITLE = "Someone else claimed this bounty first!";
const SUCCESS_TITLE = "Successfully claimed!";
const RACE_RESULT = { success: false, error: "ALREADY_CLAIMED" };
const SUCCESS_RESULT = { success: true };

describe("ClaimButton", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders an enabled Claim Bounty button by default", () => {
    mockHooks();
    render(<ClaimButton bountyId="b1" />);
    expect(screen.getByRole("button", { name: "Claim Bounty" })).toBeEnabled();
    expect(screen.queryByText(RACE_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(SUCCESS_TITLE)).not.toBeInTheDocument();
  });

  it("disables the button and shows progress while claiming", () => {
    mockHooks({ isClaiming: true });
    render(<ClaimButton bountyId="b1" />);
    const button = screen.getByRole("button", { name: /Processing claim/ });
    expect(button).toBeDisabled();
  });

  it("clicking resets state then calls claim()", async () => {
    mockHooks();
    render(<ClaimButton bountyId="b1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Claim Bounty" }));
    });
    expect(reset).toHaveBeenCalledTimes(1);
    expect(claim).toHaveBeenCalledTimes(1);
    expect(reset.mock.invocationCallOrder[0]).toBeLessThan(claim.mock.invocationCallOrder[0]);
  });

  it("renders the already-claimed view instead of a button when status is claimed", () => {
    mockHooks({}, { status: "claimed", bounty: { id: "b1", status: "claimed", claimedBy: "bob" } });
    render(<ClaimButton bountyId="b1" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/This bounty has already been/)).toBeInTheDocument();
    expect(screen.getByText("Claimed by: bob")).toBeInTheDocument();
  });

  it("omits the claimant line when claimedBy is missing", () => {
    mockHooks({}, { status: "claimed", bounty: { id: "b1", status: "claimed" } });
    render(<ClaimButton bountyId="b1" />);
    expect(screen.queryByText(/Claimed by:/)).not.toBeInTheDocument();
  });

  it("shows the auto-refresh hint only while polling", () => {
    mockHooks({}, { isPolling: true });
    render(<ClaimButton bountyId="b1" />);
    expect(screen.getByText(/Auto-refreshing status/)).toBeInTheDocument();
  });

  describe("race-lost message (ALREADY_CLAIMED)", () => {
    it("shows the race message and refetches", () => {
      mockHooks({ lastResult: RACE_RESULT });
      render(<ClaimButton bountyId="b1" />);
      expect(screen.getByText(RACE_TITLE)).toBeInTheDocument();
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("auto-dismisses after 15s and calls reset(), not before", () => {
      mockHooks({ lastResult: RACE_RESULT });
      render(<ClaimButton bountyId="b1" />);

      act(() => jest.advanceTimersByTime(14999));
      expect(screen.getByText(RACE_TITLE)).toBeInTheDocument();
      expect(reset).not.toHaveBeenCalled();

      act(() => jest.advanceTimersByTime(1));
      expect(screen.queryByText(RACE_TITLE)).not.toBeInTheDocument();
      expect(reset).toHaveBeenCalledTimes(1);
    });

    it("can be dismissed manually via the Dismiss button", () => {
      mockHooks({ lastResult: RACE_RESULT });
      render(<ClaimButton bountyId="b1" />);
      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
      expect(screen.queryByText(RACE_TITLE)).not.toBeInTheDocument();
    });

    it("ignores failures that are not ALREADY_CLAIMED", () => {
      mockHooks({ lastResult: { success: false, error: "NETWORK" } });
      render(<ClaimButton bountyId="b1" />);
      expect(screen.queryByText(RACE_TITLE)).not.toBeInTheDocument();
      expect(refetch).not.toHaveBeenCalled();
    });
  });

  describe("success message", () => {
    it("shows success, refetches and calls onClaimSuccess", () => {
      const onClaimSuccess = jest.fn();
      mockHooks({ lastResult: SUCCESS_RESULT });
      render(<ClaimButton bountyId="b1" onClaimSuccess={onClaimSuccess} />);
      expect(screen.getByText(SUCCESS_TITLE)).toBeInTheDocument();
      expect(refetch).toHaveBeenCalledTimes(1);
      expect(onClaimSuccess).toHaveBeenCalledTimes(1);
    });

    it("auto-dismisses after 5s and calls reset(), not before", () => {
      mockHooks({ lastResult: SUCCESS_RESULT });
      render(<ClaimButton bountyId="b1" />);

      act(() => jest.advanceTimersByTime(4999));
      expect(screen.getByText(SUCCESS_TITLE)).toBeInTheDocument();
      expect(reset).not.toHaveBeenCalled();

      act(() => jest.advanceTimersByTime(1));
      expect(screen.queryByText(SUCCESS_TITLE)).not.toBeInTheDocument();
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });

  it("clears the pending auto-dismiss timer on unmount", () => {
    mockHooks({ lastResult: SUCCESS_RESULT });
    const { unmount } = render(<ClaimButton bountyId="b1" />);
    unmount();
    act(() => jest.advanceTimersByTime(5000));
    expect(reset).not.toHaveBeenCalled();
  });

  it("a new result replaces the previous timer (race message after success)", () => {
    mockHooks({ lastResult: SUCCESS_RESULT });
    const { rerender } = render(<ClaimButton bountyId="b1" />);
    mockHooks({ lastResult: RACE_RESULT });
    rerender(<ClaimButton bountyId="b1" />);

    // The 5s success timer was cleared, so nothing resets at 5s...
    act(() => jest.advanceTimersByTime(5000));
    expect(reset).not.toHaveBeenCalled();
    expect(screen.getByText(RACE_TITLE)).toBeInTheDocument();

    // ...only the 15s race timer fires.
    act(() => jest.advanceTimersByTime(10000));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(RACE_TITLE)).not.toBeInTheDocument();
  });
});
