import { render, screen } from "@testing-library/react";
import { fetchBounty } from "@/lib/api";
import type { Bounty, BountyStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import IssueDetailPage, { generateMetadata } from "./page";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("@/lib/api", () => ({ fetchBounty: jest.fn() }));
jest.mock("./IssueActions", () => ({ IssueActions: () => null }));
jest.mock("@/components/bounty/BountyDescription", () => ({
  BountyDescription: ({ description }: { description: string }) => (
    <p>{description}</p>
  ),
}));

const mockFetchBounty = fetchBounty as jest.MockedFunction<typeof fetchBounty>;

function makeBounty(overrides: Partial<Bounty> = {}): Bounty {
  return {
    id: "test-issue",
    org: "mergefi",
    repo: "frontend",
    issueNumber: 42,
    title: "Test bounty",
    description: "A test bounty description.",
    reward: 125,
    asset: "USDC",
    difficulty: "beginner",
    status: "open",
    deadline: null,
    labels: [],
    ...overrides,
  };
}

async function renderIssue(bounty: Bounty) {
  mockFetchBounty.mockResolvedValue({ data: bounty, source: "mock" });
  const page = await IssueDetailPage({
    params: Promise.resolve({ id: bounty.id }),
  });
  render(page);
}

describe("IssueDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["open", "Awaiting funding"],
    ["funded", "Funds locked"],
    ["claimed", "Funds locked"],
    ["in_review", "Funds locked"],
    ["merged", "Funds locked"],
    ["paid", "Paid out"],
    ["refunded", "Refunded to sponsor"],
    ["expired", "Expired, unclaimed"],
  ] as const)(
    "shows the escrow label for %s bounties",
    async (status, label) => {
      await renderIssue(makeBounty({ status: status as BountyStatus }));

      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );

  it("renders duplicate team-split roles without a React key warning", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await renderIssue(
      makeBounty({
        teamSplits: [
          { role: "Contributor", percentage: 50 },
          { role: "Contributor", percentage: 50 },
        ],
      }),
    );

    expect(screen.getAllByText("Contributor")).toHaveLength(2);
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("same key"),
    );
    consoleError.mockRestore();
  });

  it("shows the milestone indicator for milestone bounties", async () => {
    await renderIssue(makeBounty({ milestoneId: "milestone-1" }));
    expect(screen.getByText("Part of a funded milestone")).toBeInTheDocument();
  });

  it("omits the milestone indicator for non-milestone bounties", async () => {
    await renderIssue(makeBounty());
    expect(
      screen.queryByText("Part of a funded milestone"),
    ).not.toBeInTheDocument();
  });

  it("builds issue metadata from the bounty title, reward, and description", async () => {
    const bounty = makeBounty();
    mockFetchBounty.mockResolvedValue({ data: bounty, source: "mock" });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: bounty.id }),
    });

    expect(metadata.title).toBe(
      `${bounty.title} — ${formatCurrency(bounty.reward, bounty.asset)} | MergeFi`,
    );
    expect(metadata.description).toBe(bounty.description);
    expect(metadata.openGraph?.description).toBe(bounty.description);
  });
});
