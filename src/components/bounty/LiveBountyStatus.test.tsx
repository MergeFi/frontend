/**
 * LiveBountyStatus.test.tsx (#914)
 *
 * LiveBountyStatus is the issue-detail page's live indicator: BountyStatus
 * wired to the shared poller at a 5s interval. With the poller hook mocked,
 * this pins what the page shows for live data, mock fallback data, and a
 * bounty whose polling has stopped.
 */

import { render, screen } from "@testing-library/react";
import { useBountyStatus } from "@/hooks/useBountyStatus";
import type { Bounty } from "@/types/bounty";
import { LiveBountyStatus } from "./LiveBountyStatus";

jest.mock("@/hooks/useBountyStatus");

const mockUseBountyStatus = useBountyStatus as jest.MockedFunction<typeof useBountyStatus>;

const bounty = { id: "b1", status: "funded", claimedBy: undefined } as unknown as Bounty;

function hookResult(overrides: Partial<ReturnType<typeof useBountyStatus>>) {
  return {
    bounty,
    isLoading: false,
    error: null,
    isPolling: true,
    isLive: true,
    status: "funded",
    source: "live",
    refetch: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useBountyStatus>;
}

describe("LiveBountyStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("subscribes to the shared poller for its bounty at a 5s interval", () => {
    mockUseBountyStatus.mockReturnValue(hookResult({}));

    render(<LiveBountyStatus bountyId="b1" fallbackBounty={bounty} />);

    expect(mockUseBountyStatus).toHaveBeenCalledWith(
      expect.objectContaining({ bountyId: "b1", fallbackBounty: bounty, interval: 5000 }),
    );
  });

  it("shows the live indicator for live data, with no mock badge", () => {
    mockUseBountyStatus.mockReturnValue(hookResult({ source: "live" }));

    render(<LiveBountyStatus bountyId="b1" />);

    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.queryByText("Mock Data")).not.toBeInTheDocument();
  });

  it("flags mock fallback data", () => {
    mockUseBountyStatus.mockReturnValue(hookResult({ source: "mock" }));

    render(<LiveBountyStatus bountyId="b1" />);

    expect(screen.getByText("Mock Data")).toBeInTheDocument();
  });

  it("reports polling as stopped for a terminal status", () => {
    mockUseBountyStatus.mockReturnValue(
      hookResult({ status: "paid", isLive: false, isPolling: false }),
    );

    render(<LiveBountyStatus bountyId="b1" />);

    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
  });

  it("passes className through to the rendered status", () => {
    mockUseBountyStatus.mockReturnValue(hookResult({}));

    const { container } = render(<LiveBountyStatus bountyId="b1" className="extra" />);

    expect(container.firstChild).toHaveClass("extra");
  });
});
