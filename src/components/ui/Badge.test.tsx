/**
 * Badge.test.tsx
 *
 * StatusBadge/DifficultyBadge encode two enum-keyed style maps that
 * TypeScript checks for exhaustiveness at compile time, but nothing
 * previously asserted the *rendered* label text or class per status/
 * difficulty at runtime (#212). Covers every BountyStatus and Difficulty
 * value, plus the "in_review" -> "in review" space transform.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { StatusBadge, DifficultyBadge, Badge } from "./Badge";
import type { BountyStatus, Difficulty } from "@/types";

const ALL_STATUSES: BountyStatus[] = [
  "open",
  "funded",
  "claimed",
  "in_review",
  "merged",
  "paid",
  "refunded",
  "expired",
];

const ALL_DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced", "expert"];

describe("StatusBadge", () => {
  it.each(ALL_STATUSES)("renders the correct label for status %s", (status) => {
    render(<StatusBadge status={status} />);
    const expectedLabel = status.replace("_", " ");
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('renders "in review" (space, not underscore) for in_review', () => {
    render(<StatusBadge status="in_review" />);
    expect(screen.getByText("in review")).toBeInTheDocument();
    expect(screen.queryByText("in_review")).not.toBeInTheDocument();
  });

  it.each(ALL_STATUSES)("applies a distinct ring/background class for status %s", (status) => {
    render(<StatusBadge status={status} />);
    const el = screen.getByText(status.replace("_", " "));
    expect(el.className).toMatch(/ring-/);
  });
});

describe("DifficultyBadge", () => {
  it.each(ALL_DIFFICULTIES)("renders the correct label for difficulty %s", (difficulty) => {
    render(<DifficultyBadge difficulty={difficulty} />);
    expect(screen.getByText(difficulty)).toBeInTheDocument();
  });

  it.each(ALL_DIFFICULTIES)("applies a distinct ring/background class for difficulty %s", (difficulty) => {
    render(<DifficultyBadge difficulty={difficulty} />);
    const el = screen.getByText(difficulty);
    expect(el.className).toMatch(/ring-/);
  });
});

describe("Badge", () => {
  it("renders arbitrary children with the default style", () => {
    render(<Badge>Custom label</Badge>);
    expect(screen.getByText("Custom label")).toBeInTheDocument();
  });

  it("merges a custom className with the default style", () => {
    render(<Badge className="test-extra-class">Custom</Badge>);
    expect(screen.getByText("Custom").className).toMatch(/test-extra-class/);
  });
});
