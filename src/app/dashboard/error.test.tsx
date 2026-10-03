import { render, screen, fireEvent } from "@testing-library/react";
import DashboardError from "./error";

describe("DashboardError (#441)", () => {
  it("renders ErrorBoundary with route-specific title", () => {
    const reset = jest.fn();
    const error = new Error("Dashboard render failed");

    render(<DashboardError error={error} reset={reset} />);

    expect(screen.getByText("Failed to load dashboard")).toBeInTheDocument();
  });

  it("triggers reset callback when Try again button is clicked", () => {
    const reset = jest.fn();
    const error = new Error("Dashboard render failed");

    render(<DashboardError error={error} reset={reset} />);

    const button = screen.getByRole("button", { name: "Try again" });
    fireEvent.click(button);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
