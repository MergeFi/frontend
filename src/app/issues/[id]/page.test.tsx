import { render, screen } from "@testing-library/react";
import IssueDetailPage from "./page";
import * as api from "@/lib/api";
import type { Bounty } from "@/types";

jest.mock("@/lib/api");

const baseBounty: Bounty = {
  id: "bounty-1",
  issueId: 101,
  issueNumber: 101,
  title: "Implement responsive grid",
  description: "Fix layout on issue detail page",
  amount: 500,
  asset: "USDC",
  status: "open",
  createdAt: new Date().toISOString(),
  deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
  repository: "MergeFi/frontend",
};

describe("IssueDetailPage stat grid layout (#443)", () => {
  it("renders 3-column grid layout when bounty has no milestoneId", async () => {
    (api.fetchBountyById as jest.Mock).mockResolvedValue({
      data: { ...baseBounty, milestoneId: undefined },
    });

    const page = await IssueDetailPage({ params: Promise.resolve({ id: "bounty-1" }) });
    const { container } = render(page);

    const grid = container.querySelector(".grid.gap-4");
    expect(grid).toHaveClass("sm:grid-cols-3");
    expect(grid).not.toHaveClass("lg:grid-cols-4");
    expect(screen.queryByText("Milestone")).not.toBeInTheDocument();
  });

  it("renders 2x2 and 4-column responsive grid layout when bounty has milestoneId", async () => {
    (api.fetchBountyById as jest.Mock).mockResolvedValue({
      data: { ...baseBounty, milestoneId: "milestone-xyz" },
    });

    const page = await IssueDetailPage({ params: Promise.resolve({ id: "bounty-1" }) });
    const { container } = render(page);

    const grid = container.querySelector(".grid.gap-4");
    expect(grid).toHaveClass("sm:grid-cols-2");
    expect(grid).toHaveClass("lg:grid-cols-4");
    expect(screen.getByText("Milestone")).toBeInTheDocument();
    expect(screen.getByText("Part of a funded milestone")).toBeInTheDocument();
  });
});
