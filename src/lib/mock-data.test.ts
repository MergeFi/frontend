import { describe, it, expect } from "vitest";
import { mockBounties } from "./mock-data";
import type { BountyStatus } from "@/types";

describe("mockBounties (#355)", () => {
  it("includes representative bounties covering all 8 BountyStatus values", () => {
    const requiredStatuses: BountyStatus[] = [
      "open",
      "funded",
      "claimed",
      "in_review",
      "merged",
      "paid",
      "refunded",
      "expired",
    ];

    const presentStatuses = new Set(mockBounties.map((b) => b.status));

    for (const status of requiredStatuses) {
      expect(
        presentStatuses.has(status),
        `Expected mockBounties to include at least one bounty with status "${status}"`,
      ).toBe(true);
    }
  });

  it("has unique IDs for every mock bounty", () => {
    const ids = mockBounties.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("contains valid reward amounts and positive issue numbers", () => {
    for (const b of mockBounties) {
      expect(b.reward).toBeGreaterThan(0);
      expect(b.issueNumber).toBeGreaterThan(0);
      expect(b.repo.length).toBeGreaterThan(0);
      expect(b.org.length).toBeGreaterThan(0);
      expect(b.title.length).toBeGreaterThan(0);
    }
  });
});
