/**
 * trend.test.ts
 *
 * Unit tests for the dashboard StatCard trend computation.
 *
 * Method under test: week-over-week percentage change (most recent value vs
 * the immediately prior value), rounded to a whole number, per the JSDoc in
 * `trend.ts`. Fixtures cover the acceptance criteria in the issue:
 *  - trending up   → positive result
 *  - trending down → negative result
 *  - flat          → 0
 *  - too short     → undefined (never a fabricated placeholder)
 *  - zero prior period → undefined (division by zero)
 */

import { computeTrend } from "./trend";

describe("computeTrend", () => {
  it("returns a positive percentage when the latest period is higher", () => {
    // [420, 560, 310, 780, 640, 890, 720, 1050] → (1050 - 720) / 720 ≈ 45.8%
    expect(computeTrend([420, 560, 310, 780, 640, 890, 720, 1050])).toBe(46);
  });

  it("returns a negative percentage when the latest period is lower", () => {
    // (420 - 720) / 720 = -41.7%
    expect(computeTrend([900, 840, 880, 720, 420])).toBe(-42);
  });

  it("returns 0 when the latest period is unchanged", () => {
    expect(computeTrend([500, 700, 700])).toBe(0);
  });

  it("returns undefined when there are fewer than 2 data points", () => {
    expect(computeTrend([])).toBeUndefined();
    expect(computeTrend([1050])).toBeUndefined();
  });

  it("returns undefined for null/undefined history", () => {
    expect(computeTrend(undefined)).toBeUndefined();
    expect(computeTrend(null as unknown as number[])).toBeUndefined();
  });

  it("returns undefined when the prior period is zero (no division by zero)", () => {
    expect(computeTrend([0, 1050])).toBeUndefined();
  });

  it("rounds to the nearest whole number like StatCard's integer display", () => {
    // (1000 - 333) / 333 = 200.3%
    expect(computeTrend([333, 1000])).toBe(200);
  });
});
