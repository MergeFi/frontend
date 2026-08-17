/**
 * utils.test.ts
 *
 * Tests for utility functions, with special focus on formatCurrency's
 * sign-handling behavior (issue #90).
 */

import {
  formatCurrency,
  formatPercent,
  parseMoneyInput,
  coerceDecimal,
  coerceNonNegative,
  coerceFraction,
  coercePercentage,
  coerceStatus,
  validateTeamSplits,
  generateIdempotencyKey,
  toCents,
  toMajorUnits,
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

    it("limits USDC to 2 decimal places", () => {
      expect(formatCurrency(123.456789, "USDC")).toBe("123.46 USDC");
    });

    it("shows up to 7 decimal places for XLM", () => {
      expect(formatCurrency(12.3456789, "XLM")).toBe("12.3456789 XLM");
      expect(formatCurrency(-12.3456789, "XLM")).toBe("-12.3456789 XLM");
    });

    it("does not display small nonzero XLM as zero", () => {
      expect(formatCurrency(0.0000005, "XLM")).not.toBe("0 XLM");
    });

    it("does not add trailing zeros for whole numbers", () => {
      expect(formatCurrency(100, "USDC")).toBe("100 USDC");
      expect(formatCurrency(100, "XLM")).toBe("100 XLM");
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
  it("accepts values in [0, 1]", () => {
    expect(coerceFraction("0")).toBe(0);
    expect(coerceFraction("0.5")).toBe(0.5);
    expect(coerceFraction("1")).toBe(1);
  });

  it("clamps values below 0 to 0", () => {
    expect(coerceFraction("-0.5")).toBe(0);
  });

  it("clamps values above 1 to 1", () => {
    expect(coerceFraction("1.5")).toBe(1);
    expect(coerceFraction("100")).toBe(1);
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

// ─── coerceStatus ─────────────────────────────────────────────────────────

describe("coerceStatus", () => {
  it("accepts all valid BountyStatus values", () => {
    const statuses = [
      "open", "funded", "claimed", "in_review",
      "merged", "paid", "refunded", "expired",
    ] as const;
    for (const s of statuses) {
      expect(coerceStatus(s)).toBe(s);
    }
  });

  it("falls back to 'open' for an unrecognized string", () => {
    expect(coerceStatus("banana")).toBe("open");
  });

  it("falls back to 'open' for null", () => {
    expect(coerceStatus(null)).toBe("open");
  });

  it("falls back to 'open' for undefined", () => {
    expect(coerceStatus(undefined)).toBe("open");
  });

  it("falls back to 'open' for empty string", () => {
    expect(coerceStatus("")).toBe("open");
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

  it("treats an empty array as valid with a zero sum", () => {
    const result = validateTeamSplits([]);
    expect(result.valid).toBe(true);
    expect(result.sum).toBe(0);
    expect(result.message).toBeUndefined();
  });

  it("handles mixed string and number percentages in one array", () => {
    const result = validateTeamSplits([
      { percentage: "45.5" },
      { percentage: 30 },
      { percentage: "24.5" },
    ]);
    expect(result.valid).toBe(true);
    expect(result.sum).toBe(100);
  });

  it("honors a custom tolerance", () => {
    const wide = [{ percentage: 60 }, { percentage: 43 }];
    expect(validateTeamSplits(wide).valid).toBe(false);
    expect(validateTeamSplits(wide, 5).valid).toBe(true);
  });

  it("returns a non-finite-safe result for unparseable strings", () => {
    const result = validateTeamSplits([
      { percentage: "abc" },
      { percentage: 100 },
    ]);
    expect(result.valid).toBe(false);
  });

  it("degrades a non-numeric percentage string to 0 instead of producing NaN (#198)", () => {
    const result = validateTeamSplits([
      { percentage: "abc" },
      { percentage: "50" },
    ]);
    expect(Number.isNaN(result.sum)).toBe(false);
    expect(result.sum).toBe(50);
    expect(result.valid).toBe(false);
    expect(result.message).not.toContain("NaN");
    expect(result.message).toContain("50.00%");
  });
});

// ─── parseMoneyInput ────────────────────────────────────────────────────────

describe("parseMoneyInput", () => {
  describe("valid inputs", () => {
    it("accepts a whole number", () => {
      const r = parseMoneyInput("100", "USDC");
      expect(r.valid).toBe(true);
      expect(r.normalized).toBe("100");
    });

    it("accepts a decimal with valid precision for USDC", () => {
      const r = parseMoneyInput("12.50", "USDC");
      expect(r.valid).toBe(true);
      expect(r.normalized).toBe("12.5");
    });

    it("accepts a decimal with valid precision for XLM", () => {
      const r = parseMoneyInput("12.3456789", "XLM");
      expect(r.valid).toBe(true);
      expect(r.normalized).toBe("12.3456789");
    });

    it("normalizes trailing zeros", () => {
      const r = parseMoneyInput("1.10", "USDC");
      expect(r.valid).toBe(true);
      expect(r.normalized).toBe("1.1");
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty string", () => {
      const r = parseMoneyInput("", "USDC");
      expect(r.valid).toBe(false);
      expect(r.error).toBeDefined();
    });

    it("rejects zero", () => {
      const r = parseMoneyInput("0", "USDC");
      expect(r.valid).toBe(false);
      expect(r.error).toContain("greater than zero");
    });

    it("rejects negative values", () => {
      const r = parseMoneyInput("-50", "USDC");
      expect(r.valid).toBe(false);
      expect(r.error).toContain("greater than zero");
    });

    it("rejects non-numeric text", () => {
      const r = parseMoneyInput("abc", "USDC");
      expect(r.valid).toBe(false);
    });

    it("rejects Infinity", () => {
      const r = parseMoneyInput("1e500", "USDC");
      expect(r.valid).toBe(false);
    });

    it("rejects over-precision for USDC (more than 2 decimals)", () => {
      const r = parseMoneyInput("10.555", "USDC");
      expect(r.valid).toBe(false);
      expect(r.error).toContain("2 decimal places");
    });

    it("rejects over-precision for XLM (more than 7 decimals)", () => {
      const r = parseMoneyInput("1.12345678", "XLM");
      expect(r.valid).toBe(false);
      expect(r.error).toContain("7 decimal places");
    });
  });

  describe("defaults", () => {
    it("defaults to USDC when asset is omitted", () => {
      const r = parseMoneyInput("10.555");
      expect(r.valid).toBe(false);
      expect(r.error).toContain("2 decimal places");
    });
  });
});

// ─── generateIdempotencyKey ────────────────────────────────────────────────

describe("generateIdempotencyKey", () => {
  it("returns a UUID v4 string", () => {
    const key = generateIdempotencyKey();
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("generates unique keys on successive calls", () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateIdempotencyKey()));
    expect(keys.size).toBe(50);
  });
});

// ─── toCents / toMajorUnits ────────────────────────────────────────────────

describe("toCents", () => {
  it("converts a USDC string to cents", () => {
    expect(toCents("12.50")).toBe(1250);
    expect(toCents("0.01")).toBe(1);
    expect(toCents("100")).toBe(10000);
  });

  it("converts an XLM string to minor units (7 decimals)", () => {
    expect(toCents("1.0000000", 7)).toBe(10000000);
    expect(toCents("0.0000001", 7)).toBe(1);
  });

  it("converts a number to cents", () => {
    expect(toCents(12.5)).toBe(1250);
    expect(toCents(0.01)).toBe(1);
  });

  it("handles whole numbers without a decimal point", () => {
    expect(toCents("100")).toBe(10000);
  });

  it("sums without float drift (#17)", () => {
    // 0.1 + 0.2 in float = 0.30000000000000004
    const a = toCents("0.1");
    const b = toCents("0.2");
    expect(a + b).toBe(30); // exact integer
    expect(toMajorUnits(a + b)).toBe(0.3);
  });
});

describe("toMajorUnits", () => {
  it("converts cents to dollars", () => {
    expect(toMajorUnits(1250)).toBe(12.5);
    expect(toMajorUnits(1)).toBe(0.01);
    expect(toMajorUnits(0)).toBe(0);
  });

  it("converts minor units back for XLM (7 decimals)", () => {
    expect(toMajorUnits(10000000, 7)).toBe(1);
    expect(toMajorUnits(1, 7)).toBe(0.0000001);
  });
});
