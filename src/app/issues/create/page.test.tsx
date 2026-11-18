/**
 * page.test.tsx (#916)
 *
 * The bounty-creation form is the app's primary money-entry point, so its
 * amount validation and submit path are covered directly: a rejected amount
 * must surface as a field error and never reach the API, and an accepted one
 * must be sent in the normalized wire form with an idempotency key.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CreateBountyPage from "./page";

const push = jest.fn();
const back = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
}));

const mockApiPost = jest.fn();
jest.mock("@/lib/api", () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}));

function fill(amount: string, asset: "USDC" | "XLM" = "USDC") {
  fireEvent.change(screen.getByLabelText("GitHub issue"), {
    target: { value: "mergefi/frontend#42" },
  });
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText("Asset"), { target: { value: asset } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Create bounty" }));
}

describe("CreateBountyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form fields", () => {
    render(<CreateBountyPage />);

    expect(screen.getByRole("heading", { name: "Create bounty" })).toBeInTheDocument();
    expect(screen.getByLabelText("GitHub issue")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Asset")).toBeInTheDocument();
    expect(screen.getByLabelText("Difficulty")).toBeInTheDocument();
    expect(screen.getByLabelText("Deadline (optional)")).toBeInTheDocument();
  });

  it.each([
    ["0", "Amount must be greater than zero."],
    ["abc", "Enter a valid number."],
    ["1.234", "USDC supports up to 2 decimal places."],
  ])("shows a field error for %p and does not submit", async (amount, message) => {
    render(<CreateBountyPage />);
    fill(amount);
    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("submits a valid bounty with the normalized amount and an idempotency key", async () => {
    mockApiPost.mockResolvedValue({});
    render(<CreateBountyPage />);
    fill("12.50");
    submit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/issues"));
    expect(mockApiPost).toHaveBeenCalledTimes(1);
    const [path, body, idempotencyKey] = mockApiPost.mock.calls[0];
    expect(path).toBe("/bounties");
    expect(body).toEqual({
      issue: "mergefi/frontend#42",
      amount: "12.5",
      asset: "USDC",
      difficulty: "beginner",
      deadline: undefined,
    });
    expect(typeof idempotencyKey).toBe("string");
    expect(idempotencyKey).not.toHaveLength(0);
  });

  it("surfaces an API failure as an error instead of navigating", async () => {
    mockApiPost.mockRejectedValue(new Error("Issue is already funded"));
    render(<CreateBountyPage />);
    fill("100");
    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Issue is already funded");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create bounty" })).not.toBeDisabled();
  });
});
