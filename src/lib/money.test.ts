import { parseMoneyInput } from "./money";

describe("parseMoneyInput", () => {
  it("rejects empty or whitespace-only strings", () => {
    expect(parseMoneyInput("").valid).toBe(false);
    expect(parseMoneyInput("   ").valid).toBe(false);
  });

  it("rejects zero and negative values", () => {
    expect(parseMoneyInput("0").valid).toBe(false);
    expect(parseMoneyInput("0.00").valid).toBe(false);
    expect(parseMoneyInput("-5").valid).toBe(false);
    expect(parseMoneyInput("-0.01").valid).toBe(false);
  });

  it("rejects non-numeric and scientific notation input", () => {
    expect(parseMoneyInput("abc").valid).toBe(false);
    expect(parseMoneyInput("1e10").valid).toBe(false);
    expect(parseMoneyInput("NaN").valid).toBe(false);
    expect(parseMoneyInput("Infinity").valid).toBe(false);
  });

  it("enforces decimal precision limit for USDC (2 decimals)", () => {
    expect(parseMoneyInput("10.5", "USDC")).toEqual({ valid: true, normalized: "10.5" });
    expect(parseMoneyInput("10.50", "USDC")).toEqual({ valid: true, normalized: "10.50" });
    expect(parseMoneyInput("10.555", "USDC").valid).toBe(false);
  });

  it("enforces decimal precision limit for XLM (7 decimals)", () => {
    expect(parseMoneyInput("10.1234567", "XLM")).toEqual({ valid: true, normalized: "10.1234567" });
    expect(parseMoneyInput("10.12345678", "XLM").valid).toBe(false);
  });

  it("normalizes and trims valid numbers", () => {
    expect(parseMoneyInput("  100  ")).toEqual({ valid: true, normalized: "100" });
    expect(parseMoneyInput("25.5")).toEqual({ valid: true, normalized: "25.5" });
  });

  it("rejects amounts exceeding 100,000,000 limit", () => {
    expect(parseMoneyInput("100000001").valid).toBe(false);
  });
});
