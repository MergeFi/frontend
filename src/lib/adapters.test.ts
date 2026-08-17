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
