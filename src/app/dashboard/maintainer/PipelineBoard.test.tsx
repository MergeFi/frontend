/**
 * Tests for PipelineBoard (#88).
 *
 * The pipeline board previously had no column for "merged" (payout-pending)
 * bounties, silently dropping them from the board even though the page's
 * own "Value locked in escrow" stat still counted them. Extracted from the
 * async MaintainerDashboardPage into a plain function of already-fetched
 * bounties so it's directly testable without mocking data-fetching.
 */

import { render, screen } from "@testing-library/react";
import { PipelineBoard, pipelineStages } from "./PipelineBoard";
import type { Bounty } from "@/types";

function makeBounty(overrides: Partial<Bounty> = {}): Bounty {
  return {
    id: "bounty-1",
    repo: "smartdrop-backend",
    org: "SmartDropLabs",
    issueNumber: 42,
    title: "Fix retry backoff jitter",
    description: "A description",
    reward: 500,
    asset: "USDC",
    difficulty: "intermediate",
    status: "open",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    labels: [],
    ...overrides,
  };
}

describe("PipelineBoard — merged column (#88)", () => {
  it("renders a bounty with status 'merged' in a visible pipeline column", () => {
    const merged = makeBounty({ id: "merged-1", title: "Merged, awaiting payout", status: "merged" });
    render(<PipelineBoard bounties={[merged]} />);

    expect(screen.getByText("Merged, awaiting payout")).toBeInTheDocument();
    // A column labelled for the merged stage exists and shows count 1.
    expect(screen.getByText("Awaiting payout")).toBeInTheDocument();
  });

  it("includes 'merged' in pipelineStages", () => {
    expect(pipelineStages.some((s) => s.status === "merged")).toBe(true);
  });

});
