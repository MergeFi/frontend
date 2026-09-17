import { render } from "@testing-library/react";
import ReputationLoading from "./loading";

describe("ReputationLoading (#438)", () => {
  it("renders animated skeleton container with pulse animation", () => {
    const { container } = render(<ReputationLoading />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("animate-pulse");
  });

  it("renders 4 stat card skeleton placeholders", () => {
    const { container } = render(<ReputationLoading />);
    const cards = container.querySelectorAll(".grid-cols-1.sm\\:grid-cols-2 > div");
    expect(cards.length).toBe(4);
  });
});
