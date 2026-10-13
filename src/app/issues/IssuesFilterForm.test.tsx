import { render, fireEvent } from "@testing-library/react";
import { IssuesFilterForm } from "./IssuesFilterForm";

describe("IssuesFilterForm (#701)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("disables default selects and empty inputs when submitted", () => {
    const { container } = render(
      <IssuesFilterForm>
        <select name="difficulty" defaultValue="all">
          <option value="all">Any difficulty</option>
          <option value="beginner">Beginner</option>
        </select>
        <select name="asset" defaultValue="all">
          <option value="all">Any asset</option>
          <option value="USDC">USDC</option>
        </select>
        <input name="minReward" defaultValue="" />
        <input name="maxReward" defaultValue="" />
        <select name="sort" defaultValue="default">
          <option value="default">Default</option>
          <option value="reward-desc">Reward</option>
        </select>
        <button type="submit">Apply</button>
      </IssuesFilterForm>,
    );

    const form = container.querySelector("form")!;
    const difficultySelect = container.querySelector<HTMLSelectElement>('select[name="difficulty"]')!;
    const assetSelect = container.querySelector<HTMLSelectElement>('select[name="asset"]')!;
    const minRewardInput = container.querySelector<HTMLInputElement>('input[name="minReward"]')!;
    const maxRewardInput = container.querySelector<HTMLInputElement>('input[name="maxReward"]')!;
    const sortSelect = container.querySelector<HTMLSelectElement>('select[name="sort"]')!;

    expect(difficultySelect.disabled).toBe(false);
    expect(assetSelect.disabled).toBe(false);
    expect(minRewardInput.disabled).toBe(false);
    expect(maxRewardInput.disabled).toBe(false);
    expect(sortSelect.disabled).toBe(false);

    fireEvent.submit(form);

    // On submit, default selects and empty inputs should be disabled so GET omits them
    expect(difficultySelect.disabled).toBe(true);
    expect(assetSelect.disabled).toBe(true);
    expect(minRewardInput.disabled).toBe(true);
    expect(maxRewardInput.disabled).toBe(true);
    expect(sortSelect.disabled).toBe(true);

    // After timer runs, fields re-enable for interactivity
    jest.runAllTimers();
    expect(difficultySelect.disabled).toBe(false);
    expect(assetSelect.disabled).toBe(false);
    expect(minRewardInput.disabled).toBe(false);
    expect(maxRewardInput.disabled).toBe(false);
    expect(sortSelect.disabled).toBe(false);
  });

  it("keeps non-default and non-empty inputs enabled on submit", () => {
    const { container } = render(
      <IssuesFilterForm>
        <input type="hidden" name="status" value="open" />
        <select name="difficulty" defaultValue="beginner">
          <option value="all">Any difficulty</option>
          <option value="beginner">Beginner</option>
        </select>
        <select name="asset" defaultValue="all">
          <option value="all">Any asset</option>
          <option value="USDC">USDC</option>
        </select>
        <input name="minReward" defaultValue="50" />
        <input name="maxReward" defaultValue="" />
        <select name="sort" defaultValue="reward-desc">
          <option value="default">Default</option>
          <option value="reward-desc">Reward</option>
        </select>
        <button type="submit">Apply</button>
      </IssuesFilterForm>,
    );

    const form = container.querySelector("form")!;
    const statusInput = container.querySelector<HTMLInputElement>('input[name="status"]')!;
    const difficultySelect = container.querySelector<HTMLSelectElement>('select[name="difficulty"]')!;
    const assetSelect = container.querySelector<HTMLSelectElement>('select[name="asset"]')!;
    const minRewardInput = container.querySelector<HTMLInputElement>('input[name="minReward"]')!;
    const maxRewardInput = container.querySelector<HTMLInputElement>('input[name="maxReward"]')!;
    const sortSelect = container.querySelector<HTMLSelectElement>('select[name="sort"]')!;

    fireEvent.submit(form);

    // Active filters remain enabled
    expect(statusInput.disabled).toBe(false);
    expect(difficultySelect.disabled).toBe(false);
    expect(minRewardInput.disabled).toBe(false);
    expect(sortSelect.disabled).toBe(false);

    // Defaults and empty inputs are disabled
    expect(assetSelect.disabled).toBe(true);
    expect(maxRewardInput.disabled).toBe(true);
  });

  it("restores disabled elements immediately if submit is prevented", () => {
    const onSubmit = jest.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
    });

    const { container } = render(
      <IssuesFilterForm onSubmit={onSubmit}>
        <select name="difficulty" defaultValue="all">
          <option value="all">Any difficulty</option>
        </select>
        <input name="minReward" defaultValue="" />
      </IssuesFilterForm>,
    );

    const form = container.querySelector("form")!;
    const difficultySelect = container.querySelector<HTMLSelectElement>('select[name="difficulty"]')!;
    const minRewardInput = container.querySelector<HTMLInputElement>('input[name="minReward"]')!;

    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalled();
    // Because preventDefault was called, inputs should be restored immediately
    expect(difficultySelect.disabled).toBe(false);
    expect(minRewardInput.disabled).toBe(false);
  });
});
