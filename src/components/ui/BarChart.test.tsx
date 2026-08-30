/**
 * BarChart.test.tsx
 *
 * The chart's bars are visual-only divs — hover `title` tooltips are
 * invisible to keyboards and screen readers, so the accessible copy of the
 * data lives in a visually-hidden caption list (#15). Asserts that every
 * data point is announced as text, that the visual layer is marked
 * aria-hidden, and that formatValue drives the announced figures.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { BarChart } from "./BarChart";

const DATA = [
  { label: "alpha", value: 10 },
  { label: "beta", value: 0 },
  { label: "gamma", value: -4 },
];

describe("BarChart accessibility", () => {
  it("announces every label:value pair in the visually-hidden caption list", () => {
    render(<BarChart data={DATA} />);
    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(screen.getByText("alpha: 10")).toBeInTheDocument();
    expect(screen.getByText("beta: 0")).toBeInTheDocument();
    expect(screen.getByText("gamma: -4")).toBeInTheDocument();
  });

  it("formats announced values through formatValue when provided", () => {
    render(<BarChart data={[{ label: "spend", value: 1250 }]} formatValue={(v) => `$${v}` } />);
    expect(screen.getByText("spend: $1250")).toBeInTheDocument();
  });

  it("marks the visual bar layer aria-hidden so bars are not double-announced", () => {
    const { container } = render(<BarChart data={DATA} />);
    const visualLayer = container.querySelector("div[aria-hidden='true']");
    expect(visualLayer).not.toBeNull();
    // All three bars render inside the hidden layer
    expect(visualLayer?.querySelectorAll(".group").length).toBe(3);
  });

  it("renders an empty caption list without crashing on empty data", () => {
    render(<BarChart data={[]} />);
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
