/**
 * adapters.test.ts
 *
 * Tests for adaptBounty's mapping of milestoneId (#86) — declared on the
 * Bounty type but never actually set by adaptBounty prior to this fix.
 */

import { adaptBounty, adaptReputation, type RawBounty } from "./adapters";

function rawBounty(overrides: Partial<RawBounty> = {}): RawBounty {
  return {
    id: "bounty-1",
    amount: "500",
    asset: "USDC",
    difficulty: "intermediate",
    status: "open",
    deadline: "2026-01-01T00:00:00.000Z",
    escrowId: null,
    issue: {
      number: 42,
      title: "Fix the thing",
      body: "Description",
      labels: ["bug"],
      repository: { owner: "acme", name: "widgets" },
    },
    ...overrides,
  };
}

describe("adaptBounty — milestoneId mapping (#86)", () => {
  it("maps milestoneId from the nested issue when the issue belongs to a milestone", () => {
    const raw = rawBounty({
      issue: {
        number: 42,
        title: "Fix the thing",
        body: "Description",
        labels: ["bug"],
        repository: { owner: "acme", name: "widgets" },
        milestoneId: "milestone-7",
      },
    });

    expect(adaptBounty(raw).milestoneId).toBe("milestone-7");
  });

  it("leaves milestoneId undefined when the issue has no milestone association", () => {
    // issue.milestoneId omitted entirely — the realistic shape for most
    // issues, which aren't part of any milestone.
    const raw = rawBounty();
    expect(adaptBounty(raw).milestoneId).toBeUndefined();
  });

  it("normalizes a null milestoneId (no association) the same as an omitted one", () => {
    // mergefi-backend's Issue.milestoneId is a nullable column, so the
    // real backend response says "no milestone" via `null`, not by
    // omitting the key entirely.
    const raw = rawBounty({
      issue: {
        number: 42,
        title: "Fix the thing",
        body: "Description",
        labels: ["bug"],
        repository: { owner: "acme", name: "widgets" },
        milestoneId: null,
      },
    });

    expect(adaptBounty(raw).milestoneId).toBeUndefined();
  });

  it("leaves milestoneId undefined when the bounty has no issue at all", () => {
    const raw = rawBounty({ issue: undefined });
    expect(adaptBounty(raw).milestoneId).toBeUndefined();
  });
});

describe("adaptBounty — field coverage audit (#86)", () => {
  // Every key the Bounty interface declares (src/types/index.ts). Kept as
  // an explicit list, checked against adaptBounty's actual output below,
  // so a future field added to Bounty but never mapped here — exactly
  // milestoneId's bug — fails this test instead of silently shipping.
  const EXPECTED_BOUNTY_FIELDS = [
    "id",
    "repo",
    "org",
    "issueNumber",
    "title",
    "description",
    "reward",
    "asset",
    "difficulty",
    "status",
    "deadline",
    "labels",
    "claimedBy",
    "teamSplits",
    "milestoneId",
    "escrowId",
  ] as const;

  it("sets every Bounty field to a defined value given a fully-populated raw bounty", () => {
    const raw = rawBounty({
      escrowId: "escrow-1",
      claimedBy: { username: "alice" },
      team: { splits: [{ role: "Lead", percentage: "100", user: { username: "alice" } }] },
      issue: {
        number: 42,
        title: "Fix the thing",
        body: "Description",
        labels: ["bug"],
        repository: { owner: "acme", name: "widgets" },
        milestoneId: "milestone-7",
      },
    });

    const bounty = adaptBounty(raw);

    for (const field of EXPECTED_BOUNTY_FIELDS) {
      expect(bounty[field]).not.toBeUndefined();
    }
  });
});

describe("adaptReputation — rate clamping and fraction coercion (#91)", () => {
  const user = { username: "alice", avatarUrl: null };

  it("scales normal in-range percentages into 0-1 fractions", () => {
    const profile = adaptReputation(user, {
      totalEarnings: "1000",
      mergedPrCount: 5,
      completionRate: "94",
      avgReviewTimeHours: "4.5",
      onTimeDeliveryPercentage: "88",
      languages: { TypeScript: 10 },
      orgsContributedTo: ["MergeFi"],
    });

    expect(profile.completionRate).toBe(0.94);
    expect(profile.onTimeDeliveryRate).toBe(0.88);
  });

  it("clamps corrupted out-of-range rates (> 100%) to exactly 1", () => {
    const profile = adaptReputation(user, {
      totalEarnings: "1000",
      mergedPrCount: 5,
      completionRate: "150",
      avgReviewTimeHours: "4.5",
      onTimeDeliveryPercentage: "200",
      languages: {},
      orgsContributedTo: [],
    });

    expect(profile.completionRate).toBe(1);
    expect(profile.onTimeDeliveryRate).toBe(1);
  });

  it("clamps negative rates (< 0%) to exactly 0", () => {
    const profile = adaptReputation(user, {
      totalEarnings: "1000",
      mergedPrCount: 5,
      completionRate: "-25",
      avgReviewTimeHours: "4.5",
      onTimeDeliveryPercentage: "-10",
      languages: {},
      orgsContributedTo: [],
    });

    expect(profile.completionRate).toBe(0);
    expect(profile.onTimeDeliveryRate).toBe(0);
  });

  it("handles null snapshot gracefully by returning 0 for rates", () => {
    const profile = adaptReputation(user, null);

    expect(profile.completionRate).toBe(0);
    expect(profile.onTimeDeliveryRate).toBe(0);
  });

  it("handles invalid or non-numeric rate strings gracefully", () => {
    const profile = adaptReputation(user, {
      totalEarnings: "1000",
      mergedPrCount: 5,
      completionRate: "NaN",
      avgReviewTimeHours: "4.5",
      onTimeDeliveryPercentage: "invalid",
      languages: {},
      orgsContributedTo: [],
    });

    expect(profile.completionRate).toBe(0);
    expect(profile.onTimeDeliveryRate).toBe(0);
  });
});
