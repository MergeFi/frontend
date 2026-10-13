import { fireEvent, render, screen } from "@testing-library/react";
import { IssuesFilterForm } from "./IssuesFilterForm";
import { parseBountyQuery } from "@/lib/bounty-query";

const DIFFICULTY_LABELS = {
  all: "Any difficulty",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
} as const;

const ASSET_LABELS = { all: "Any asset", USDC: "USDC", XLM: "XLM" } as const;

/** Reads the <form> element's GET submission as a plain param record. */
function submittedParams(form: HTMLFormElement): URLSearchParams {
  const data = new FormData(form);
  return new URLSearchParams(data as unknown as Record<string, string>);
}

describe("IssuesFilterForm — default/empty fields omitted on submit (#701)", () => {
  it("excludes every default select and empty number input from the submission", () => {
    render(
      <IssuesFilterForm
        query={parseBountyQuery({})}
        filterActive={false}
        difficultyLabels={DIFFICULTY_LABELS}
        assetLabels={ASSET_LABELS}
      />,
    );

    const form = screen.getByRole("button", { name: "Apply filters" }).closest("form")!;
    fireEvent.submit(form);

    const params = submittedParams(form);
    expect(params.has("difficulty")).toBe(false);
    expect(params.has("asset")).toBe(false);
    expect(params.has("sort")).toBe(false);
    expect(params.has("minReward")).toBe(false);
    expect(params.has("maxReward")).toBe(false);
  });

  it("still includes a non-default value chosen for each field", () => {
    render(
      <IssuesFilterForm
        query={parseBountyQuery({
          difficulty: "expert",
          asset: "USDC",
          sort: "reward-desc",
          minReward: "50",
          maxReward: "200",
        })}
        filterActive
        difficultyLabels={DIFFICULTY_LABELS}
        assetLabels={ASSET_LABELS}
      />,
    );

    const form = screen.getByRole("button", { name: "Apply filters" }).closest("form")!;
    fireEvent.submit(form);

    const params = submittedParams(form);
    expect(params.get("difficulty")).toBe("expert");
    expect(params.get("asset")).toBe("USDC");
    expect(params.get("sort")).toBe("reward-desc");
    expect(params.get("minReward")).toBe("50");
    expect(params.get("maxReward")).toBe("200");
  });

  it("only includes the fields a visitor actually changed, not every default", () => {
    render(
      <IssuesFilterForm
        query={parseBountyQuery({ asset: "XLM" })}
        filterActive
        difficultyLabels={DIFFICULTY_LABELS}
        assetLabels={ASSET_LABELS}
      />,
    );

    const form = screen.getByRole("button", { name: "Apply filters" }).closest("form")!;
    fireEvent.submit(form);

    const params = submittedParams(form);
    expect(params.get("asset")).toBe("XLM");
    expect(params.has("difficulty")).toBe(false);
    expect(params.has("sort")).toBe(false);
    expect(params.has("minReward")).toBe(false);
    expect(params.has("maxReward")).toBe(false);
  });
});
