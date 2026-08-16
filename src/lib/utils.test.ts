import { validateTeamSplits } from "./utils";

describe("validateTeamSplits", () => {
  it("returns valid for empty splits", () => {
    expect(validateTeamSplits([])).toEqual({ valid: true, sum: 0 });
  });

  it("returns valid when splits sum to 100", () => {
    const splits = [{ percentage: 60 }, { percentage: 40 }];
    const res = validateTeamSplits(splits);
    expect(res.valid).toBe(true);
    expect(res.sum).toBe(100);
  });

  it("handles string percentage representations", () => {
    const splits = [{ percentage: "70" }, { percentage: "30" }];
    const res = validateTeamSplits(splits);
    expect(res.valid).toBe(true);
    expect(res.sum).toBe(100);
  });

  it("returns invalid when splits do not sum to 100", () => {
    const splits = [{ percentage: 50 }, { percentage: 40 }];
    const res = validateTeamSplits(splits);
    expect(res.valid).toBe(false);
    expect(res.sum).toBe(90);
    expect(res.message).toBe("Team splits sum to 90.00% (expected 100%)");
  });
});
