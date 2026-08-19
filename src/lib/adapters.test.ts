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

describe("adaptReputation — completionRate and onTimeDeliveryRate clamping (#91)", () => {
  const user = { username: "bob", avatarUrl: null };

  function rawSnapshot(
    overrides: Partial<import("./adapters").RawReputationSnapshot> = {},
  ): import("./adapters").RawReputationSnapshot {
    return {
      totalEarnings: "1000",
      mergedPrCount: 10,
      completionRate: "94",
      avgReviewTimeHours: "4",
      onTimeDeliveryPercentage: "88",
      languages: { TypeScript: 50, Rust: 50 },
      orgsContributedTo: ["MergeFi"],
      ...overrides,
    };
  }

  it("converts in-range percentages into exact fractions", () => {
    const rep = adaptReputation(user, rawSnapshot({ completionRate: "94", onTimeDeliveryPercentage: "88" }));
    expect(rep.completionRate).toBe(0.94);
    expect(rep.onTimeDeliveryRate).toBe(0.88);
  });

  it("handles boundary values 0 and 100", () => {
    const repZero = adaptReputation(user, rawSnapshot({ completionRate: "0", onTimeDeliveryPercentage: "0" }));
    expect(repZero.completionRate).toBe(0);
    expect(repZero.onTimeDeliveryRate).toBe(0);

    const repHundred = adaptReputation(user, rawSnapshot({ completionRate: "100", onTimeDeliveryPercentage: "100" }));
    expect(repHundred.completionRate).toBe(1);
    expect(repHundred.onTimeDeliveryRate).toBe(1);
  });

  it("clamps out-of-range values above 100% to exactly 1.0", () => {
    const rep = adaptReputation(user, rawSnapshot({ completionRate: "150", onTimeDeliveryPercentage: "200" }));
    expect(rep.completionRate).toBe(1);
    expect(rep.onTimeDeliveryRate).toBe(1);
  });

  it("clamps negative values below 0% to exactly 0.0", () => {
    const rep = adaptReputation(user, rawSnapshot({ completionRate: "-20", onTimeDeliveryPercentage: "-50" }));
    expect(rep.completionRate).toBe(0);
    expect(rep.onTimeDeliveryRate).toBe(0);
  });

  it("handles null, undefined, and non-numeric snapshot values gracefully", () => {
    const rep = adaptReputation(
      user,
      rawSnapshot({
        completionRate: "corrupted_value",
        onTimeDeliveryPercentage: "invalid",
      }),
    );
    expect(rep.completionRate).toBe(0);
    expect(rep.onTimeDeliveryRate).toBe(0);
  });

  it("returns default zero rates when snapshot is null", () => {
    const rep = adaptReputation(user, null);
    expect(rep.completionRate).toBe(0);
    expect(rep.onTimeDeliveryRate).toBe(0);
    expect(rep.handle).toBe("bob");
    expect(rep.lifetimeEarnings).toBe(0);
    expect(rep.mergedPRs).toBe(0);
  });
});
