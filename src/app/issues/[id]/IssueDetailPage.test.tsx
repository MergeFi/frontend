import React from "react";
import { render, screen } from "@testing-library/react";
import IssueDetailPage from "./page";
import * as api from "@/lib/api";
import { Bounty } from "@/types";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/api", () => ({
  fetchBounty: jest.fn(),
}));

jest.mock("./IssueActions", () => ({
  IssueActions: () => <div data-testid="issue-actions-mock">Actions</div>,
}));

describe("IssueDetailPage — Team Splits Validation UI", () => {
  const baseBounty: Bounty = {
    id: "test-bounty-1",
    repo: "test-repo",
    org: "test-org",
    issueNumber: 42,
    title: "Implement feature X",
    description: "Detailed description of feature X",
    reward: 100,
    asset: "USDC",
    difficulty: "intermediate",
    status: "open",
    deadline: new Date(Date.now() + 86400000).toISOString(),
    labels: ["enhancement"],
  };

  it("renders team splits normally with no warning when splits sum to 100%", async () => {
    const validBounty: Bounty = {
      ...baseBounty,
      teamSplits: [
        { role: "Frontend", percentage: 60, contributor: "alice" },
        { role: "Backend", percentage: 40, contributor: "bob" },
      ],
      teamSplitsValid: {
        valid: true,
        sum: 100,
      },
    };

    (api.fetchBounty as jest.Mock).mockResolvedValue(validBounty);

    const Page = await IssueDetailPage({
      params: Promise.resolve({ id: "test-bounty-1" }),
    });

    render(Page);

    expect(screen.getByText("Team payout split")).toBeInTheDocument();
    expect(screen.getByText(/Frontend/)).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText(/Backend/)).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.queryByTestId("team-splits-warning")).not.toBeInTheDocument();
  });

  it("renders a visible warning banner when team splits sum to invalid percentage (e.g. 85%)", async () => {
    const invalidBounty: Bounty = {
      ...baseBounty,
      teamSplits: [
        { role: "Frontend", percentage: 50, contributor: "alice" },
        { role: "Backend", percentage: 35, contributor: "bob" },
      ],
      teamSplitsValid: {
        valid: false,
        sum: 85,
        message: "Team splits sum to 85.00% (expected 100%)",
      },
    };

    (api.fetchBounty as jest.Mock).mockResolvedValue(invalidBounty);

    const Page = await IssueDetailPage({
      params: Promise.resolve({ id: "test-bounty-1" }),
    });

    render(Page);

    expect(screen.getByText("Team payout split")).toBeInTheDocument();
    const warning = screen.getByTestId("team-splits-warning");
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent("Team splits sum to 85.00% (expected 100%)");
  });

  it("does not render the team splits section when teamSplits is absent or empty", async () => {
    const noSplitsBounty: Bounty = {
      ...baseBounty,
      teamSplits: [],
    };

    (api.fetchBounty as jest.Mock).mockResolvedValue(noSplitsBounty);

    const Page = await IssueDetailPage({
      params: Promise.resolve({ id: "test-bounty-1" }),
    });

    render(Page);

    expect(screen.queryByTestId("team-splits-section")).not.toBeInTheDocument();
    expect(screen.queryByText("Team payout split")).not.toBeInTheDocument();
  });
});
