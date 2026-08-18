
/**
 * StatCard.test.tsx
 *
 * Covers explicit loading/error/zero/loaded states, large-number handling,
 * asset-aware currency precision, and sign preservation.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./StatCard";
import { formatCurrency } from "@/lib/utils";

// ─── 1. Loading state ────────────────────────────────────────────────────────

describe("StatCard — loading state", () => {
  it("renders a skeleton and hides the value", () => {
    const { container } = render(<StatCard label="Lifetime earnings" status="loading" />);
    expect(screen.getByTestId("statcard-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("statcard-value")).not.toBeInTheDocument();
    expect(screen.queryByTestId("statcard-error")).not.toBeInTheDocument();
    expect(screen.queryByTestId("statcard-zero")).not.toBeInTheDocument();
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
    expect(errorEl).toHaveTextContent("—");
    expect(errorEl).toHaveTextContent("Error loading data");
    expect(screen.getByRole("region", { name: /Error loading data/i })).toBeInTheDocument();
  });

  it("never renders a zero value that could be mistaken for a real figure", () => {
    render(<StatCard label="Total paid out" status="error" value={0} format="currency" />);
    expect(screen.queryByTestId("statcard-value")).not.toBeInTheDocument();
    expect(screen.queryByTestId("statcard-zero")).not.toBeInTheDocument();
    expect(screen.getByTestId("statcard-error")).toBeInTheDocument();
  });
});

// ─── 3. Zero state ───────────────────────────────────────────────────────────

describe("StatCard — zero state (numeric 0)", () => {
  it("renders a deliberate zero with the default zeroLabel", () => {
    render(
      <StatCard label="Lifetime earnings" status="loaded" value={0} format="currency" />,
    );
    const zeroEl = screen.getByTestId("statcard-zero");
    expect(zeroEl).toBeInTheDocument();
    expect(zeroEl).toHaveTextContent("0");
    expect(zeroEl).toHaveTextContent("No activity yet");
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

// ─── 4. Zero-as-string pass-through ─────────────────────────────────────────

describe("StatCard — zero-as-string pass-through", () => {
  it('renders "0" string as a normal loaded value, not the zero-state', () => {
    render(<StatCard label="Completion rate" status="loaded" value="0%" />);
    expect(screen.getByTestId("statcard-value")).toBeInTheDocument();
    expect(screen.getByTestId("statcard-value")).toHaveTextContent("0%");
    expect(screen.queryByTestId("statcard-zero")).not.toBeInTheDocument();
  });
});

// ─── 5. Typical loaded value ─────────────────────────────────────────────────

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
    expect(valueEl).toHaveTextContent("8,420 USDC");
    expect(screen.getByText(/12% vs last period/i)).toBeInTheDocument();
  });

  it("does not render trend when trend prop is absent", () => {
    render(<StatCard label="Repositories" status="loaded" value={4} format="count" />);
    expect(screen.queryByText(/vs last period/i)).not.toBeInTheDocument();
  });
});

// ─── 6. Large financial value ────────────────────────────────────────────────

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
    expect(valueEl.className).toMatch(/text-xl/);
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
    expect(valueEl).toHaveAttribute("title");
    expect(valueEl.getAttribute("title") ?? "").toContain("1,284,999");
  });
});

// ─── 7. Pre-formatted string pass-through ────────────────────────────────────

describe("StatCard — pre-formatted string value", () => {
  it("passes a pre-formatted string through without modification", () => {
    render(<StatCard label="Completion rate" status="loaded" value="94%" />);
    const valueEl = screen.getByTestId("statcard-value");
    expect(valueEl).toHaveTextContent("94%");
    expect(valueEl).not.toHaveTextContent("USDC");
  });
});

// ─── 8. Asset-aware currency precision ──────────────────────────────────────

describe("StatCard — asset-aware currency precision (issue #76)", () => {
  it("renders XLM using all seven supported decimal places", () => {
    render(
      <StatCard
        label="XLM balance"
        status="loaded"
        value={12.3456789}
        format="currency"
        asset="XLM"
      />,
    );
    const valueEl = screen.getByTestId("statcard-value");
    expect(valueEl).toHaveTextContent("12.3456789 XLM");
    expect(valueEl).toHaveAttribute("title", "12.3456789 XLM");
  });

  it("keeps a small non-zero XLM amount visibly non-zero", () => {
    render(
      <StatCard
        label="XLM balance"
        status="loaded"
        value={0.0000005}
        format="currency"
        asset="XLM"
      />,
    );
    const valueEl = screen.getByTestId("statcard-value");
    expect(valueEl).toHaveTextContent("0.0000005 XLM");
    expect(valueEl).toHaveAttribute("title", "0.0000005 XLM");
    expect(screen.queryByTestId("statcard-zero")).not.toBeInTheDocument();
  });

  it("uses a non-zero bound for values below one stroop", () => {
    render(
      <StatCard
        label="XLM balance"
        status="loaded"
        value={0.00000001}
        format="currency"
        asset="XLM"
      />,
    );
    const valueEl = screen.getByTestId("statcard-value");
    expect(valueEl).toHaveTextContent("<0.0000001 XLM");
    expect(valueEl).toHaveAttribute("title", "<0.0000001 XLM");
  });

  it("keeps USDC visible formatting at two decimal places", () => {
    render(
      <StatCard
        label="USDC balance"
        status="loaded"
        value={12.3456789}
        format="currency"
        asset="USDC"
      />,
    );
    const valueEl = screen.getByTestId("statcard-value");
    expect(valueEl).toHaveTextContent("12.35 USDC");
    expect(valueEl).toHaveAttribute("title", "12.345679 USDC");
  });
});

// ─── 9. Negative currency values ─────────────────────────────────────────────

describe("StatCard — negative currency values (issue #90)", () => {
  it("renders negative currency values with a minus sign", () => {
    render(
      <StatCard
        label="Net balance"
        status="loaded"
        value={-50}
        format="currency"
      />,
    );
    const valueEl = screen.getByTestId("statcard-value");
    expect(valueEl).toBeInTheDocument();
    expect(valueEl).toHaveTextContent("-50 USDC");
  });

  it("distinguishes negative from positive for the same absolute value", () => {
    const { rerender } = render(
      <StatCard label="Balance" status="loaded" value={-50} format="currency" />,
    );
    const negativeText = screen.getByTestId("statcard-value").textContent;

    rerender(<StatCard label="Balance" status="loaded" value={50} format="currency" />);
    const positiveText = screen.getByTestId("statcard-value").textContent;

    expect(negativeText).not.toBe(positiveText);
    expect(negativeText).toContain("-");
    expect(positiveText).not.toContain("-");
  });

  it("agrees with formatCurrency for negative values", () => {
    render(
      <StatCard
        label="Net balance"
        status="loaded"
        value={-50}
        format="currency"
        asset="USDC"
      />,
    );
    const statCardOutput = screen.getByTestId("statcard-value").textContent;
    expect(statCardOutput).toBe(formatCurrency(-50, "USDC"));
  });

  it("renders negative XLM amounts correctly", () => {
    render(
      <StatCard
        label="XLM balance"
        status="loaded"
        value={-123.456789}
        format="currency"
        asset="XLM"
      />,
    );
    const valueEl = screen.getByTestId("statcard-value");
    expect(valueEl).toHaveTextContent("-123.456789 XLM");
  });

  it("renders negative trend values with correct styling", () => {
    render(
      <StatCard
        label="Budget remaining"
        status="loaded"
        value={-200}
        format="currency"
        trend={-15}
      />,
    );
    expect(screen.getByTestId("statcard-value")).toHaveTextContent("-200 USDC");
    expect(screen.getByText(/15% vs last period/i)).toBeInTheDocument();
  });
});
