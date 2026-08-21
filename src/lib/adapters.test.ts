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


describe("adaptBounty — status validation and coercion (#279)", () => {
  it("preserves valid BountyStatus values", () => {
    const validStatuses = [
      "open",
      "funded",
      "claimed",
      "in_review",
      "merged",
      "paid",
      "refunded",
      "expired",
    ] as const;

    for (const status of validStatuses) {
      const raw = rawBounty({ status });
      expect(adaptBounty(raw).status).toBe(status);
    }
  });

  it("coerces an unrecognized backend status to the safe fallback 'open'", () => {
    const raw = rawBounty({ status: "some_unrecognized_future_status" as any });
    expect(adaptBounty(raw).status).toBe("open");
  });

  it("coerces null or undefined or empty status to 'open'", () => {
    const rawNull = rawBounty({ status: null as any });
    expect(adaptBounty(rawNull).status).toBe("open");

    const rawUndefined = rawBounty({ status: undefined as any });
    expect(adaptBounty(rawUndefined).status).toBe("open");

    const rawEmpty = rawBounty({ status: "" as any });
    expect(adaptBounty(rawEmpty).status).toBe("open");
  });
});
