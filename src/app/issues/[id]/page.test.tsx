import { render, screen } from "@testing-library/react";
import IssueDetailPage, { generateMetadata } from "./page";
import { fetchBounty } from "@/lib/api";
import { notFound } from "next/navigation";
import type { Bounty, BountyStatus } from "@/types";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  fetchBounty: jest.fn(),
}));

jest.mock("./IssueActions", () => ({
  IssueActions: ({ bounty }: { bounty: Bounty }) => (
    <div data-testid="mock-issue-actions">IssueActions for {bounty.id}</div>
  ),
}));

const baseMockBounty: Bounty = {
  id: "bounty-1",
  title: "Implement Zero-Knowledge Proofs",
  description: "Detailed description of zero knowledge feature.",
  status: "open",
  reward: 1200,
  asset: "USDC",
  org: "MergeFi",
  repo: "frontend",
  issueNumber: 42,
  difficulty: "hard",
  labels: ["security", "soroban"],
  deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
  claimedBy: null,
  createdAt: new Date().toISOString(),
  milestoneId: null,
};

describe("IssueDetailPage Component & Metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateMetadata", () => {
    it("returns issue not found metadata when fetchBounty returns null", async () => {
      (fetchBounty as jest.Mock).mockResolvedValue({ data: null });

      const meta = await generateMetadata({
        params: Promise.resolve({ id: "invalid-id" }),
      });

      expect(meta.title).toBe("Issue not found | MergeFi");
    });

    it("generates correct metadata title and OpenGraph info when bounty exists", async () => {
      (fetchBounty as jest.Mock).mockResolvedValue({ data: baseMockBounty });

      const meta = await generateMetadata({
        params: Promise.resolve({ id: "bounty-1" }),
      });

      expect(meta.title).toContain("Implement Zero-Knowledge Proofs");
      expect(meta.title).toContain("1,200 USDC");
      expect(meta.openGraph?.url).toBe("/issues/bounty-1");
    });
  });

  describe("IssueDetailPage rendering", () => {
    it("calls notFound() when bounty does not exist", async () => {
      (fetchBounty as jest.Mock).mockResolvedValue({ data: null });

      await IssueDetailPage({
        params: Promise.resolve({ id: "non-existent" }),
      });

      expect(notFound).toHaveBeenCalled();
    });

    it("renders core bounty information, labels, and IssueActions", async () => {
      (fetchBounty as jest.Mock).mockResolvedValue({ data: baseMockBounty });

      const component = await IssueDetailPage({
        params: Promise.resolve({ id: "bounty-1" }),
      });
      render(component);

      expect(
        screen.getByRole("heading", { name: "Implement Zero-Knowledge Proofs" })
      ).toBeInTheDocument();
      expect(screen.getByText("MergeFi/frontend #42")).toBeInTheDocument();
      expect(screen.getByText("security")).toBeInTheDocument();
      expect(screen.getByText("soroban")).toBeInTheDocument();
      expect(screen.getByTestId("mock-issue-actions")).toBeInTheDocument();
    });

    const statusLabelPairs: Array<[BountyStatus, string]> = [
      ["open", "Awaiting funding"],
      ["funded", "Funds locked"],
      ["claimed", "Funds locked"],
      ["in_review", "Funds locked"],
      ["merged", "Funds locked"],
      ["paid", "Paid out"],
      ["refunded", "Refunded to sponsor"],
      ["expired", "Expired, unclaimed"],
    ];

    test.each(statusLabelPairs)(
      "renders correct ESCROW_STATUS_LABEL '%s' -> '%s'",
      async (status, expectedLabel) => {
        (fetchBounty as jest.Mock).mockResolvedValue({
          data: { ...baseMockBounty, status },
        });

        const component = await IssueDetailPage({
          params: Promise.resolve({ id: "bounty-status-test" }),
        });
        const { unmount } = render(component);

        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
        unmount();
      }
    );

    it("conditionally renders milestone box only when milestoneId is present", async () => {
      (fetchBounty as jest.Mock).mockResolvedValue({
        data: { ...baseMockBounty, milestoneId: null },
      });
      const compNoMilestone = await IssueDetailPage({
        params: Promise.resolve({ id: "bounty-no-milestone" }),
      });
      const { rerender } = render(compNoMilestone);
      expect(screen.queryByText("Part of a funded milestone")).not.toBeInTheDocument();

      (fetchBounty as jest.Mock).mockResolvedValue({
        data: { ...baseMockBounty, milestoneId: "milestone-99" },
      });
      const compWithMilestone = await IssueDetailPage({
        params: Promise.resolve({ id: "bounty-with-milestone" }),
      });
      rerender(compWithMilestone);
      expect(screen.getByText("Part of a funded milestone")).toBeInTheDocument();
    });

    it("renders team payout splits with duplicate/unassigned roles without key collision errors (#244)", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const bountyWithSplits: Bounty = {
        ...baseMockBounty,
        teamSplits: [
          { role: "Contributor", percentage: 50, contributor: "alice" },
          { role: "Contributor", percentage: 30, contributor: null },
          { role: "Contributor", percentage: 20, contributor: null },
        ],
      };

      (fetchBounty as jest.Mock).mockResolvedValue({ data: bountyWithSplits });

      const component = await IssueDetailPage({
        params: Promise.resolve({ id: "bounty-splits" }),
      });
      render(component);

      expect(screen.getByText("Team payout split")).toBeInTheDocument();
      expect(screen.getByText(/Contributor \(alice\)/)).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("30%")).toBeInTheDocument();
      expect(screen.getByText("20%")).toBeInTheDocument();

      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Encountered two children with the same key")
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
