import { adaptReputation, adaptBounty } from "./adapters";
import { validateTeamSplits } from "./utils";

describe("adapters — reputation clamping (#91)", () => {
  const user = { username: "alice", avatarUrl: null };

  it("clamps completionRate to 1 when backend returns > 100%", () => {
    const snapshot = {
      totalEarnings: "1000",
      mergedPrCount: 10,
      completionRate: "150",
      avgReviewTimeHours: "4",
      onTimeDeliveryPercentage: "95",
      languages: {},
      orgsContributedTo: [],
    };
    const rep = adaptReputation(user, snapshot);
    expect(rep.completionRate).toBe(1);
    expect(rep.onTimeDeliveryRate).toBe(0.95);
  });

  it("clamps negative completionRate and onTimeDeliveryPercentage to 0", () => {
    const snapshot = {
      totalEarnings: "1000",
      mergedPrCount: 10,
      completionRate: "-25",
      avgReviewTimeHours: "4",
      onTimeDeliveryPercentage: "-10",
      languages: {},
      orgsContributedTo: [],
    };
    const rep = adaptReputation(user, snapshot);
    expect(rep.completionRate).toBe(0);
    expect(rep.onTimeDeliveryRate).toBe(0);
  });

  it("preserves valid fractions within [0, 1]", () => {
    const snapshot = {
      totalEarnings: "1000",
      mergedPrCount: 10,
      completionRate: "94.5",
      avgReviewTimeHours: "4",
      onTimeDeliveryPercentage: "88",
      languages: {},
      orgsContributedTo: [],
    };
    const rep = adaptReputation(user, snapshot);
    expect(rep.completionRate).toBe(0.945);
    expect(rep.onTimeDeliveryRate).toBe(0.88);
  });
});

describe("adapters — milestoneId mapping (#86)", () => {
  it("maps milestoneId when present as flat string or relation", () => {
    const rawWithFlat = {
      id: "b1",
      amount: "100",
      asset: "USDC" as const,
      difficulty: "beginner" as const,
      status: "open" as const,
      deadline: null,
      escrowId: null,
      milestoneId: "m-123",
    };
    const bounty1 = adaptBounty(rawWithFlat);
    expect(bounty1.milestoneId).toBe("m-123");

    const rawWithNested = {
      id: "b2",
      amount: "100",
      asset: "USDC" as const,
      difficulty: "beginner" as const,
      status: "open" as const,
      deadline: null,
      escrowId: null,
      milestone: { id: "m-456" },
    };
    const bounty2 = adaptBounty(rawWithNested);
    expect(bounty2.milestoneId).toBe("m-456");
  });

  it("leaves milestoneId undefined when absent", () => {
    const raw = {
      id: "b3",
      amount: "100",
      asset: "USDC" as const,
      difficulty: "beginner" as const,
      status: "open" as const,
      deadline: null,
      escrowId: null,
    };
    const bounty = adaptBounty(raw);
    expect(bounty.milestoneId).toBeUndefined();
  });
});

describe("utils — validateTeamSplits (#68)", () => {
  it("validates team splits properly with string or number percentages", () => {
    expect(validateTeamSplits([]).valid).toBe(true);
    expect(validateTeamSplits(null).valid).toBe(true);
    expect(validateTeamSplits([{ percentage: "50" }, { percentage: 50 }]).valid).toBe(true);
    expect(validateTeamSplits([{ percentage: "60" }, { percentage: 30 }]).valid).toBe(false);
  });
});
