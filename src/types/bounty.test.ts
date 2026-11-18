import { TERMINAL_STATUSES, type BountyStatus } from "./bounty";

describe("TERMINAL_STATUSES (#924)", () => {
  it.each<BountyStatus>(["paid", "refunded", "expired", "release_failed", "unknown"])(
    "stops polling at %p",
    (status) => {
      expect(TERMINAL_STATUSES.has(status)).toBe(true);
    },
  );

  it.each<BountyStatus>(["open", "funded", "claimed", "in_review", "merged"])(
    "keeps polling a bounty that is still moving through %p",
    (status) => {
      expect(TERMINAL_STATUSES.has(status)).toBe(false);
    },
  );
});
