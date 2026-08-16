import { validateTeamSplits, formatCurrency, formatPercent, coerceFraction, coercePercentage, coerceNonNegative } from "./utils";

describe("utils unit tests", () => {
  describe("validateTeamSplits", () => {
    it("handles empty or missing splits", () => {
      expect(validateTeamSplits([])).toEqual({ valid: true, sum: 0 });
    });

    it("validates valid 100% split", () => {
      expect(validateTeamSplits([{ percentage: 50 }, { percentage: 50 }])).toEqual({
        valid: true,
        sum: 100,
        message: undefined,
      });
    });

    it("validates splits with string numbers", () => {
      expect(validateTeamSplits([{ percentage: "60" }, { percentage: "40" }])).toEqual({
        valid: true,
        sum: 100,
        message: undefined,
      });
    });

    it("rejects invalid splits", () => {
      const res = validateTeamSplits([{ percentage: 40 }, { percentage: 40 }]);
      expect(res.valid).toBe(false);
      expect(res.sum).toBe(80);
      expect(res.message).toBe("Team splits sum to 80.00% (expected 100%)");
    });
  });

  describe("formatPercent", () => {
    it("formats standard fractions", () => {
      expect(formatPercent(0.5)).toBe("50%");
      expect(formatPercent(1)).toBe("100%");
      expect(formatPercent(0)).toBe("0%");
    });

    it("handles non-finite values safely", () => {
      expect(formatPercent(NaN)).toBe("0%");
      expect(formatPercent(Infinity)).toBe("0%");
      expect(formatPercent(-Infinity)).toBe("0%");
    });
  });

  describe("formatCurrency", () => {
    it("formats USDC correctly", () => {
      expect(formatCurrency(1234.56, "USDC")).toBe("1,234.56 USDC");
      expect(formatCurrency(0, "USDC")).toBe("0 USDC");
    });
  });

  describe("coerceFraction and coercePercentage", () => {
    it("clamps fraction between 0 and 1", () => {
      expect(coerceFraction("1.5")).toBe(1);
      expect(coerceFraction("-0.5")).toBe(0);
      expect(coerceFraction("0.75")).toBe(0.75);
    });

    it("clamps percentage between 0 and 100", () => {
      expect(coercePercentage("150")).toBe(100);
      expect(coercePercentage("-10")).toBe(0);
      expect(coercePercentage("75")).toBe(75);
    });
  });
});
