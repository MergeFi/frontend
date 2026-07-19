/**
 * StatCard.test.tsx
 *
 * Covers all four explicit states (loading, error, zero, loaded) plus
 * large-number scaling and pre-formatted string pass-through.
 *
 * Seven test cases in total, matching the acceptance criteria in the issue:
 *  1. Loading state — skeleton visible, no value text
 *  2. Error state — em-dash + "Error loading data", ARIA label
 *  3. Zero state (numeric 0) — "0" rendered, zeroLabel shown, trend hidden
 *  4. Zero-as-string — must NOT trigger zero-state treatment
 *  5. Typical loaded value — renders correctly, trend shown
 *  6. Large financial value — shorter font class applied, title tooltip present
 *  7. Pre-formatted string — passed through unchanged
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./StatCard";

// ─── 1. Loading state ────────────────────────────────────────────────────────

describe("StatCard — loading state", () => {
  it("renders a skeleton and hides the value", () => {
    const { container } = render(<StatCard label="Lifetime earnings" status="loading" />);
    expect(screen.getByTestId("statcard-skeleton")).toBeInTheDocument();
    // No numeric/text value should be visible while loading
    expect(screen.queryByTestId("statcard-value")).not.toBeInTheDocument();
    expect(screen.queryByTestId("statcard-error")).not.toBeInTheDocument();
    expect(screen.queryByTestId("statcard-zero")).not.toBeInTheDocument();
    // Skeleton carries the pulse animation class
    expect(container.querySelector("[data-testid='statcard-skeleton']")).toHaveClass(
      "animate-pulse",
    );
  });
});

// ─── 2. Error state ──────────────────────────────────────────────────────────

describe("StatCard — error state", () => {
  it("renders the error indicator with correct text and ARIA label", () => {
    render(<StatCard label="Locked in escrow" status="error" />);
    const errorEl = screen.getByTestId("statcard-error");
    expect(errorEl).toBeInTheDocument();
    // Em-dash must be visible — not a zero or blank
    expect(errorEl).toHaveTextContent("—");
    // Sub-label wording
    expect(errorEl).toHaveTextContent("Error loading data");
    // Wrapper region is labelled for screen readers — prevents SR from
    // announcing the card as just "Locked in escrow" with no context
    const region = screen.getByRole("region", { name: /Error loading data/i });
    expect(region).toBeInTheDocument();
  });

  it("never renders a zero value that could be mistaken for a real figure", () => {
    render(<StatCard label="Total paid out" status="error" value={0} format="currency" />);
    expect(screen.queryByTestId("statcard-value")).not.toBeInTheDocument();
    expect(screen.queryByTestId("statcard-zero")).not.toBeInTheDocument();
    expect(screen.getByTestId("statcard-error")).toBeInTheDocument();
  });
});

// ─── 3. Zero state — numeric 0 ───────────────────────────────────────────────

describe("StatCard — zero state (numeric 0)", () => {
  it("renders a deliberate zero with the default zeroLabel", () => {
    render(
      <StatCard label="Lifetime earnings" status="loaded" value={0} format="currency" />,
    );
    const zeroEl = screen.getByTestId("statcard-zero");
    expect(zeroEl).toBeInTheDocument();
    // The value "0 USDC" must be present and readable
    expect(zeroEl).toHaveTextContent("0");
    // Default sub-label
    expect(zeroEl).toHaveTextContent("No activity yet");
    // Trend must NOT appear on a zero value (no misleading "0% vs last period")
    expect(screen.queryByText(/vs last period/i)).not.toBeInTheDocument();
  });

  it("uses a custom zeroLabel when provided", () => {
    render(
      <StatCard
        label="Active bounties"
        status="loaded"
        value={0}
        format="count"
        zeroLabel="No bounties yet"
      />,
    );
    expect(screen.getByTestId("statcard-zero")).toHaveTextContent("No bounties yet");
  });
});

// ─── 4. Zero-as-string — must NOT trigger zero-state ─────────────────────────

describe("StatCard — zero-as-string pass-through", () => {
  it('renders "0" string as a normal loaded value, not the zero-state', () => {
    // "0" as a string means the caller has pre-formatted the value.
    // We must not second-guess it and show the zero-state — that would
    // incorrectly suppress the value for things like "0%" completion rate
    // that the caller explicitly formatted.
    render(<StatCard label="Completion rate" status="loaded" value="0%" />);
    // Normal value node should appear
    expect(screen.getByTestId("statcard-value")).toBeInTheDocument();
    expect(screen.getByTestId("statcard-value")).toHaveTextContent("0%");
    // Zero-state node must NOT appear
    expect(screen.queryByTestId("statcard-zero")).not.toBeInTheDocument();
  });
});

// ─── 5. Typical loaded value ──────────────────────────────────────────────────

describe("StatCard — typical loaded value", () => {
  it("renders value and trend correctly", () => {
    render(
      <StatCard
        label="Lifetime earnings"
        status="loaded"
        value={8420}
        format="currency"
        trend={12}
      />,
    );
    const valueEl = screen.getByTestId("statcard-value");
    expect(valueEl).toBeInTheDocument();
    // Locale-formatted + asset suffix
    expect(valueEl).toHaveTextContent("8,420 USDC");
    // Trend rendered
    expect(screen.getByText(/12% vs last period/i)).toBeInTheDocument();
  });

  it("does not render trend when trend prop is absent", () => {
    render(<StatCard label="Repositories" status="loaded" value={4} format="count" />);
    expect(screen.queryByText(/vs last period/i)).not.toBeInTheDocument();
  });
});

// ─── 6. Large financial value ─────────────────────────────────────────────────

describe("StatCard — large number handling", () => {
  it("applies a smaller font class for a long value string", () => {
    render(
      <StatCard
        label="Total paid out"
        status="loaded"
        value={1_284_999}
        format="currency"
      />,
    );
    const valueEl = screen.getByTestId("statcard-value");
    // "1,284,999 USDC" is 14 chars → should get text-xl (not text-2xl)
    expect(valueEl.className).toMatch(/text-xl/);
    // Must NOT have the default large class
    expect(valueEl.className).not.toMatch(/text-2xl/);
  });

  it("exposes the full exact value via title tooltip", () => {
    render(
      <StatCard
        label="Total paid out"
        status="loaded"
        value={1_284_999}
        format="currency"
      />,
    );
    const valueEl = screen.getByTestId("statcard-value");
    // Title attribute must be present with the unabbreviated figure
    expect(valueEl).toHaveAttribute("title");
    const title = valueEl.getAttribute("title") ?? "";
    // Must contain the full number — no "1.3M" abbreviation
    expect(title).toContain("1,284,999");
  });
});

// ─── 7. Pre-formatted string pass-through ────────────────────────────────────

describe("StatCard — pre-formatted string value", () => {
  it("passes a pre-formatted string through without modification", () => {
    render(<StatCard label="Completion rate" status="loaded" value="94%" />);
    const valueEl = screen.getByTestId("statcard-value");
    expect(valueEl).toHaveTextContent("94%");
    // No extra USDC suffix should be appended
    expect(valueEl).not.toHaveTextContent("USDC");
  });
});
