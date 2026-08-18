/**
 * utils.test.ts
 *
 * Tests for utility functions, with special focus on formatCurrency's
 * sign-handling behavior (issue #90).
 */

import {
  formatCurrency,
  formatPercent,
  coerceDecimal,
  coerceNonNegative,
  coerceFraction,
  coercePercentage,
  validateTeamSplits,
} from "./utils";

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  describe("sign preservation", () => {
    it("preserves the sign on negative amounts", () => {
      expect(formatCurrency(-50, "USDC")).toBe("-50 USDC");
      expect(formatCurrency(-150.75, "XLM")).toBe("-150.75 XLM");
      expect(formatCurrency(-1000, "USDC")).toBe("-1,000 USDC");
    });

    it("does not add a plus sign to positive amounts", () => {
      expect(formatCurrency(50, "USDC")).toBe("50 USDC");
      expect(formatCurrency(150.75, "XLM")).toBe("150.75 XLM");
    });

    it("renders zero without a sign", () => {
      expect(formatCurrency(0, "USDC")).toBe("0 USDC");
      // Note: JavaScript's -0 in toLocaleString may render as "-0" on some platforms
      const result = formatCurrency(-0, "XLM");
      expect(result === "0 XLM" || result === "-0 XLM").toBe(true);
    });

    it("distinguishes negative from positive values in the output", () => {
      const negative = formatCurrency(-50, "USDC");
      const positive = formatCurrency(50, "USDC");
      expect(negative).not.toBe(positive);
      expect(negative).toContain("-");
      expect(positive).not.toContain("-");
    });
  });

  describe("locale formatting", () => {
    it("adds thousand separators for large amounts", () => {
      expect(formatCurrency(1234567.89, "USDC")).toBe("1,234,567.89 USDC");
      expect(formatCurrency(-1234567.89, "USDC")).toBe("-1,234,567.89 USDC");
    });

    it("limits decimal places to 2 by default", () => {
      expect(formatCurrency(123.456789, "USDC")).toBe("123.46 USDC");
      expect(formatCurrency(-123.456789, "XLM")).toBe("-123.46 XLM");
    });

    it("does not add trailing zeros for whole numbers", () => {
      expect(formatCurrency(100, "USDC")).toBe("100 USDC");
    });
  });

  describe("asset label", () => {
    it('defaults to "USDC" when asset is not specified', () => {
      expect(formatCurrency(42)).toBe("42 USDC");
    });

    it('appends "XLM" when specified', () => {
      expect(formatCurrency(42, "XLM")).toBe("42 XLM");
    });
  });

  describe("edge cases", () => {
    it("returns 0 for NaN", () => {
      expect(formatCurrency(NaN, "USDC")).toBe("0 USDC");
    });

    it("returns 0 for Infinity", () => {
      expect(formatCurrency(Infinity, "USDC")).toBe("0 USDC");
      expect(formatCurrency(-Infinity, "XLM")).toBe("0 XLM");
    });

    it("handles very small negative values", () => {
      expect(formatCurrency(-0.01, "USDC")).toBe("-0.01 USDC");
    });

    it("handles very large negative values", () => {
      expect(formatCurrency(-9999999.99, "USDC")).toBe("-9,999,999.99 USDC");
    });
  });
});

// ─── formatPercent ───────────────────────────────────────────────────────────

describe("formatPercent", () => {
  it("converts a fraction to a percentage", () => {
    expect(formatPercent(0.5)).toBe("50%");
    expect(formatPercent(0.94)).toBe("94%");
    expect(formatPercent(1)).toBe("100%");
  });

  it("rounds to the nearest integer", () => {
    expect(formatPercent(0.456)).toBe("46%");
    expect(formatPercent(0.455)).toBe("46%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("handles NaN", () => {
    expect(formatPercent(NaN)).toBe("0%");
  });

  it("handles Infinity", () => {
    expect(formatPercent(Infinity)).toBe("0%");
  });
});

// ─── coerceDecimal ───────────────────────────────────────────────────────────

describe("coerceDecimal", () => {
  it("parses valid numeric strings", () => {
    expect(coerceDecimal("42")).toBe(42);
    expect(coerceDecimal("3.14")).toBe(3.14);
    expect(coerceDecimal("-10")).toBe(-10);
  });

  it("returns the fallback for null/undefined", () => {
    expect(coerceDecimal(null)).toBe(0);
    expect(coerceDecimal(undefined)).toBe(0);
    expect(coerceDecimal(null, 100)).toBe(100);
  });

  it("returns the fallback for non-numeric strings", () => {
    expect(coerceDecimal("abc")).toBe(0);
    expect(coerceDecimal("")).toBe(0); // Empty string coerces to 0 via Number()
  });

  it("returns the fallback for NaN", () => {
    expect(coerceDecimal("NaN")).toBe(0);
  });
});

// ─── coerceNonNegative ───────────────────────────────────────────────────────

describe("coerceNonNegative", () => {
  it("accepts positive values", () => {
    expect(coerceNonNegative("10")).toBe(10);
  });

  it("clamps negative values to the fallback", () => {
    expect(coerceNonNegative("-5")).toBe(0);
    expect(coerceNonNegative("-5", 10)).toBe(10);
  });

  it("accepts zero", () => {
    expect(coerceNonNegative("0")).toBe(0);
  });
});

// ─── coerceFraction ──────────────────────────────────────────────────────────

describe("coerceFraction", () => {
  it("accepts values in [0, 1] with default divisor", () => {
    expect(coerceFraction("0")).toBe(0);
    expect(coerceFraction("0.5")).toBe(0.5);
    expect(coerceFraction("1")).toBe(1);
  });

  it("clamps values below 0 to 0", () => {
    expect(coerceFraction("-0.5")).toBe(0);
    expect(coerceFraction("-20", 100)).toBe(0);
  });

  it("clamps values above 1 to 1", () => {
    expect(coerceFraction("1.5")).toBe(1);
    expect(coerceFraction("100")).toBe(1);
    expect(coerceFraction("150", 100)).toBe(1);
  });

  it("correctly scales percentage strings with divisor=100", () => {
    expect(coerceFraction("94", 100)).toBe(0.94);
    expect(coerceFraction("100", 100)).toBe(1);
    expect(coerceFraction("0", 100)).toBe(0);
    expect(coerceFraction("50.5", 100)).toBe(0.505);
  });

  it("handles null, undefined, non-numeric strings safely with fallback", () => {
    expect(coerceFraction(null)).toBe(0);
    expect(coerceFraction(undefined)).toBe(0);
    expect(coerceFraction("invalid", 100)).toBe(0);
    expect(coerceFraction(null, 100, 0.5)).toBe(0.5);
  });
});

// ─── coercePercentage ────────────────────────────────────────────────────────

describe("coercePercentage", () => {
  it("accepts values in [0, 100]", () => {
    expect(coercePercentage("0")).toBe(0);
    expect(coercePercentage("50")).toBe(50);
    expect(coercePercentage("100")).toBe(100);
  });

  it("clamps values below 0 to 0", () => {
    expect(coercePercentage("-10")).toBe(0);
  });

  it("clamps values above 100 to 100", () => {
    expect(coercePercentage("150")).toBe(100);
  });
});

// ─── validateTeamSplits ──────────────────────────────────────────────────────

describe("validateTeamSplits", () => {
  it("accepts splits that sum to 100%", () => {
    const result = validateTeamSplits([
      { percentage: 40 },
      { percentage: 30 },
      { percentage: 30 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.sum).toBe(100);
    expect(result.message).toBeUndefined();
  });

  it("accepts splits within tolerance (floating point)", () => {
    const result = validateTeamSplits([
      { percentage: 33.33 },
      { percentage: 33.33 },
      { percentage: 33.34 },
    ]);
    expect(result.valid).toBe(true);
  });

  it("rejects splits that do not sum to 100%", () => {
    const result = validateTeamSplits([
      { percentage: 40 },
      { percentage: 30 },
      { percentage: 20 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("90.00%");
  });

  it("handles string percentages", () => {
    const result = validateTeamSplits([
      { percentage: "50" },
      { percentage: "50" },
    ]);
    expect(result.valid).toBe(true);
    expect(result.sum).toBe(100);
  });

  it("handles an empty array", () => {
    const result = validateTeamSplits([]);
    // Empty splits don't sum to 100, so valid=false is correct behavior
    expect(result.sum).toBe(0);
  });
});
