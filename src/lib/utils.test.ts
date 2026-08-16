import { formatCurrency, formatPercent, coerceDecimal, coerceNonNegative, coerceFraction, coercePercentage, validateTeamSplits } from "./utils";

describe("utils - formatCurrency", () => {
  it("formats standard positive amounts with default asset USDC", () => {
    expect(formatCurrency(50)).toBe("50 USDC");
    expect(formatCurrency(1234.56)).toBe("1,234.56 USDC");
  });

  it("formats positive amounts with XLM asset", () => {
    expect(formatCurrency(100, "XLM")).toBe("100 XLM");
  });

  it("handles non-finite numbers safely", () => {
    expect(formatCurrency(NaN)).toBe("0 USDC");
    expect(formatCurrency(Infinity)).toBe("0 USDC");
  });

  it("preserves negative sign on negative numbers", () => {
    expect(formatCurrency(-50, "USDC")).toBe("-50 USDC");
    expect(formatCurrency(-1234.5, "USDC")).toBe("-1,234.5 USDC");
    expect(formatCurrency(-50, "XLM")).toBe("-50 XLM");
  });
});
