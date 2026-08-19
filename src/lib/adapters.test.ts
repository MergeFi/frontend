/**
 * adapters.test.ts
 *
 * Tests for adaptBounty's mapping of milestoneId (#86) — declared on the
 * Bounty type but never actually set by adaptBounty prior to this fix.
 */

import { adaptBounty, type RawBounty } from "./adapters";

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

import { adaptReputation, type RawUserProfile, type RawReputationSnapshot } from "./adapters";

describe("adaptReputation — percentage clamping (#91)", () => {
  const user: RawUserProfile = { username: "testuser", avatarUrl: null };

  it("clamps completionRate to 1 when backend sends > 100", () => {
    const snapshot: RawReputationSnapshot = {
      totalEarnings: "1000",
      mergedPrCount: 10,
      completionRate: "150",
      avgReviewTimeHours: "5",
      onTimeDeliveryPercentage: "90",
      languages: { TypeScript: 10 },
      orgsContributedTo: ["acme"],
    };
    expect(adaptReputation(user, snapshot).completionRate).toBe(1);
  });

  it("clamps completionRate to 0 when backend sends negative", () => {
    const snapshot: RawReputationSnapshot = {
      totalEarnings: "1000",
      mergedPrCount: 10,
      completionRate: "-20",
      avgReviewTimeHours: "5",
      onTimeDeliveryPercentage: "90",
      languages: { TypeScript: 10 },
      orgsContributedTo: ["acme"],
    };
    expect(adaptReputation(user, snapshot).completionRate).toBe(0);
  });

  it("clamps onTimeDeliveryRate to 1 when backend sends > 100", () => {
    const snapshot: RawReputationSnapshot = {
      totalEarnings: "1000",
      mergedPrCount: 10,
      completionRate: "90",
      avgReviewTimeHours: "5",
      onTimeDeliveryPercentage: "120",
      languages: { TypeScript: 10 },
      orgsContributedTo: ["acme"],
    };
    expect(adaptReputation(user, snapshot).onTimeDeliveryRate).toBe(1);
  });

  it("preserves normal in-range values without regression", () => {
    const snapshot: RawReputationSnapshot = {
      totalEarnings: "1000",
      mergedPrCount: 10,
      completionRate: "94",
      avgReviewTimeHours: "5",
      onTimeDeliveryPercentage: "85",
      languages: { TypeScript: 10 },
      orgsContributedTo: ["acme"],
    };
    const profile = adaptReputation(user, snapshot);
    expect(profile.completionRate).toBe(0.94);
    expect(profile.onTimeDeliveryRate).toBe(0.85);
  });
});
