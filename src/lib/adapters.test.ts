import { adaptReputation } from "./adapters";
import type { RawUserProfile, RawReputationSnapshot } from "./adapters";

const baseUser: RawUserProfile = {
  username: "testuser",
  avatarUrl: null,
};

function makeSnapshot(overrides: Partial<RawReputationSnapshot>): RawReputationSnapshot {
  return {
    totalEarnings: "1000",
    mergedPrCount: 10,
    completionRate: "94",
    avgReviewTimeHours: "24",
    onTimeDeliveryPercentage: "88",
    languages: { TypeScript: 5 },
    orgsContributedTo: ["mergefi"],
    ...overrides,
  };
}

describe("adaptReputation fraction clamping", () => {
  it("clamps completionRate > 100% to exactly 1", () => {
    const result = adaptReputation(baseUser, makeSnapshot({ completionRate: "150" }));
    expect(result.completionRate).toBe(1);
  });

  it("clamps negative completionRate to exactly 0", () => {
    const result = adaptReputation(baseUser, makeSnapshot({ completionRate: "-20" }));
    expect(result.completionRate).toBe(0);
  });

  it("preserves normal completionRate without regression", () => {
    const result = adaptReputation(baseUser, makeSnapshot({ completionRate: "94" }));
    expect(result.completionRate).toBeCloseTo(0.94);
  });

  it("clamps onTimeDeliveryRate > 100% to exactly 1", () => {
    const result = adaptReputation(baseUser, makeSnapshot({ onTimeDeliveryPercentage: "200" }));
    expect(result.onTimeDeliveryRate).toBe(1);
  });

  it("clamps negative onTimeDeliveryRate to exactly 0", () => {
    const result = adaptReputation(baseUser, makeSnapshot({ onTimeDeliveryPercentage: "-50" }));
    expect(result.onTimeDeliveryRate).toBe(0);
  });

  it("preserves normal onTimeDeliveryRate without regression", () => {
    const result = adaptReputation(baseUser, makeSnapshot({ onTimeDeliveryPercentage: "88" }));
    expect(result.onTimeDeliveryRate).toBeCloseTo(0.88);
  });

  it("returns 0 for both rates when snapshot is null", () => {
    const result = adaptReputation(baseUser, null);
    expect(result.completionRate).toBe(0);
    expect(result.onTimeDeliveryRate).toBe(0);
  });
});
