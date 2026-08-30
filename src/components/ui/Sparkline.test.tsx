/**
 * Sparkline.test.tsx
 *
 * The polyline is color-only decoration, so the accessible value is the
 * computed trend summary announced via role="img" + aria-label, with an
 * explicit decorative opt-out for contexts that already announce the trend
 * as text (StatCard) (#15).
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { Sparkline } from "./Sparkline";

describe("Sparkline accessibility", () => {
  it("renders nothing for fewer than 2 points (unchanged behavior)", () => {
    const { container } = render(<Sparkline data={[5]} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("exposes an increasing trend via role=img and an aria-label", () => {
    render(<Sparkline data={[10, 20, 42]} />);
    const svg = screen.getByRole("img");
    expect(svg).toHaveAttribute(
      "aria-label",
      "Trend from 10 to 42 (320% increase)",
    );
  });

  it("describes a decrease with a positive magnitude", () => {
    render(<Sparkline data={[100, 75]} />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Trend from 100 to 75 (25% decrease)",
    );
  });

  it("respects a custom label override", () => {
    render(<Sparkline data={[1, 2]} label="Earnings over the last 6 payouts" />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Earnings over the last 6 payouts",
    );
  });

  it("renders hidden from assistive tech when decorative", () => {
    render(<Sparkline data={[1, 2, 3]} decorative />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("aria-label");
  });

  it("still draws the polyline geometry in decorative mode", () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} decorative />);
    expect(container.querySelectorAll("polyline").length).toBe(2);
  });
});
