import { render, screen, fireEvent } from "@testing-library/react";
import MilestonesError from "./error";

describe("MilestonesError (#440)", () => {
  it("renders ErrorBoundary with route-specific title", () => {
    const reset = jest.fn();
    const error = new Error("Fetch failed");

    render(<MilestonesError error={error} reset={reset} />);

    expect(screen.getByText("Failed to load milestones")).toBeInTheDocument();
  });

  it("triggers reset callback when Try again button is clicked", () => {
    const reset = jest.fn();
    const error = new Error("Fetch failed");

    render(<MilestonesError error={error} reset={reset} />);

    const button = screen.getByRole("button", { name: "Try again" });
    fireEvent.click(button);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
