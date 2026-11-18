/**
 * IssuesFilterForm.test.tsx (#912)
 *
 * The form produces the query string bounty-query.ts parses. These tests pin
 * the form side of that contract: untouched defaults are left out of the URL
 * (#701), every control round-trips through parseBountyQuery, and a submitted
 * filter never carries a stale `page`.
 */

import { fireEvent, render } from "@testing-library/react";
import { buildBountyQueryString, parseBountyQuery } from "@/lib/bounty-query";
import { IssuesFilterForm } from "./IssuesFilterForm";

function renderForm() {
  const { container } = render(
    <IssuesFilterForm>
      <select name="difficulty" data-default="all" defaultValue="all">
        <option value="all">All</option>
        <option value="beginner">Beginner</option>
        <option value="advanced">Advanced</option>
      </select>
      <select name="asset" data-default="all" defaultValue="all">
        <option value="all">All</option>
        <option value="USDC">USDC</option>
        <option value="XLM">XLM</option>
      </select>
      <input type="number" name="minReward" defaultValue="" />
      <input type="number" name="maxReward" defaultValue="" />
      <select name="sort" data-default="default" defaultValue="default">
        <option value="default">Default</option>
        <option value="reward-desc">Reward: high to low</option>
      </select>
      <button type="submit">Apply</button>
    </IssuesFilterForm>,
  );
  return container.querySelector("form") as HTMLFormElement;
}

/** What the browser would put in the URL: FormData skips disabled fields. */
function submit(form: HTMLFormElement): URLSearchParams {
  fireEvent.submit(form);
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form).entries()) {
    params.append(key, String(value));
  }
  return params;
}

function setValue(form: HTMLFormElement, name: string, value: string) {
  const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  fireEvent.change(field, { target: { value } });
}

describe("IssuesFilterForm", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("is a GET form targeting /issues", () => {
    const form = renderForm();
    expect(form.getAttribute("method")).toBe("get");
    expect(form.getAttribute("action")).toBe("/issues");
  });

  it("submits untouched defaults as a bare /issues with no query string", () => {
    const form = renderForm();
    expect(submit(form).toString()).toBe("");
  });

  it("keeps only the fields that differ from their default", () => {
    const form = renderForm();
    setValue(form, "difficulty", "advanced");
    setValue(form, "minReward", "50");

    const params = submit(form);
    expect(params.get("difficulty")).toBe("advanced");
    expect(params.get("minReward")).toBe("50");
    expect(params.has("asset")).toBe(false);
    expect(params.has("maxReward")).toBe(false);
    expect(params.has("sort")).toBe(false);
  });

  it("round-trips every control through parseBountyQuery", () => {
    const form = renderForm();
    setValue(form, "difficulty", "beginner");
    setValue(form, "asset", "XLM");
    setValue(form, "minReward", "10");
    setValue(form, "maxReward", "500");
    setValue(form, "sort", "reward-desc");

    const params = submit(form);
    const query = parseBountyQuery(Object.fromEntries(params.entries()));
    expect(query).toMatchObject({
      difficulty: "beginner",
      asset: "XLM",
      minReward: 10,
      maxReward: 500,
      sort: "reward-desc",
    });
    expect(buildBountyQueryString(query)).toBe(`?${params.toString()}`);
  });

  it("never carries a page, so changing a filter starts again at page 1", () => {
    const form = renderForm();
    setValue(form, "asset", "USDC");

    const params = submit(form);
    expect(params.has("page")).toBe(false);
    expect(parseBountyQuery(Object.fromEntries(params.entries())).page).toBe(1);
  });

  it("re-enables the fields it disabled once the submission is captured", () => {
    jest.useFakeTimers();
    const form = renderForm();
    submit(form);

    const difficulty = form.elements.namedItem("difficulty") as HTMLSelectElement;
    expect(difficulty.disabled).toBe(true);
    jest.runAllTimers();
    expect(difficulty.disabled).toBe(false);
  });
});
