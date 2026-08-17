import { adaptBounty, adaptMilestone, adaptMaintenancePool, adaptReputation, RawBounty } from "./adapters";

describe("adaptBounty", () => {
  const baseRaw: RawBounty = {
    id: "bounty-123",
    amount: "500",
    asset: "USDC",
    difficulty: "intermediate",
    status: "open",
    deadline: "2026-12-31T00:00:00.000Z",
    escrowId: "escrow-456",
    issue: {
      number: 42,
      title: "Fix the thing",
      body: "Description of fix",
      labels: ["bug", "frontend"],
      repository: {
        name: "frontend",
        owner: "MergeFi",
      },
    },
  };

  it("maps milestoneId when present on raw bounty or issue", () => {
    const rawWithDirectMilestone: RawBounty = {
      ...baseRaw,
      milestoneId: "milestone-direct-1",
    };
    const adaptedDirect = adaptBounty(rawWithDirectMilestone);
    expect(adaptedDirect.milestoneId).toBe("milestone-direct-1");

    const rawWithIssueMilestone: RawBounty = {
      ...baseRaw,
      issue: {
        ...baseRaw.issue!,
        milestoneId: "milestone-issue-2",
      },
    };
    const adaptedIssue = adaptBounty(rawWithIssueMilestone);
    expect(adaptedIssue.milestoneId).toBe("milestone-issue-2");
  });

  it("sets milestoneId to undefined when not present", () => {
    const adapted = adaptBounty(baseRaw);
    expect(adapted.milestoneId).toBeUndefined();
  });

  it("maps all standard fields correctly", () => {
    const adapted = adaptBounty(baseRaw);
    expect(adapted.id).toBe("bounty-123");
    expect(adapted.repo).toBe("frontend");
    expect(adapted.org).toBe("MergeFi");
    expect(adapted.issueNumber).toBe(42);
    expect(adapted.title).toBe("Fix the thing");
    expect(adapted.description).toBe("Description of fix");
    expect(adapted.reward).toBe(500);
    expect(adapted.asset).toBe("USDC");
    expect(adapted.difficulty).toBe("intermediate");
    expect(adapted.status).toBe("open");
    expect(adapted.escrowId).toBe("escrow-456");
    expect(adapted.labels).toEqual(["bug", "frontend"]);
  });
});
