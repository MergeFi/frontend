/**
 * Tests for ActivityList's amount rendering (#87).
 *
 * `{event.amount && (...)}` renders a bare, unstyled "0" text node for a
 * legitimate `amount: 0` event, since `0 && x` evaluates to `0` itself, and
 * React renders a falsy-but-numeric expression result as literal text. The
 * fix guards on `typeof event.amount === "number"` instead, matching the
 * pattern already used correctly in StatCard's trend rendering.
 */

import { render, screen } from "@testing-library/react";
import { ActivityList } from "./ActivityList";
import type { ActivityEvent } from "@/lib/mock-data";

function agoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function makeEvent(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: "a1",
    handle: "devrel_ana",
    action: "was paid",
    target: "core-indexer#288",
    occurredAt: agoIso(6),
    ...overrides,
  };
}

describe("ActivityList — amount rendering", () => {
  it("renders a correctly-formatted amount for a genuine zero, not a bare '0' text node", () => {
    render(
      <ActivityList events={[makeEvent({ amount: 0, asset: "USDC" })]} />,
    );

    // The formatted "0 USDC" string must be present...
    expect(screen.getByText("0 USDC")).toBeInTheDocument();
    // ...and it must be the *only* place a lone "0" ever appears — no
    // stray, unstyled "0" sitting next to it outside that formatted string.
    expect(screen.queryByText("0", { exact: true })).not.toBeInTheDocument();
  });

  it("renders no amount text when amount is undefined (the non-monetary event case)", () => {
    render(<ActivityList events={[makeEvent({ action: "claimed" })]} />);

    expect(screen.queryByText(/USDC|XLM/)).not.toBeInTheDocument();
    expect(screen.queryByText("0", { exact: true })).not.toBeInTheDocument();
  });

  it("renders a genuine positive amount exactly as before", () => {
    render(
      <ActivityList events={[makeEvent({ amount: 480, asset: "USDC" })]} />,
    );

    expect(screen.getByText("480 USDC")).toBeInTheDocument();
  });
});

describe("ActivityList — relative time (#217)", () => {
  it("renders the minutes branch for a value under 60", () => {
    render(<ActivityList events={[makeEvent({ occurredAt: agoIso(6) })]} />);
    expect(screen.getByText("6m ago")).toBeInTheDocument();
  });

  it("renders the minutes branch at the 59-minute boundary", () => {
    render(<ActivityList events={[makeEvent({ occurredAt: agoIso(59) })]} />);
    expect(screen.getByText("59m ago")).toBeInTheDocument();
  });

  it("renders the hours branch at the 60-minute boundary", () => {
    render(<ActivityList events={[makeEvent({ occurredAt: agoIso(60) })]} />);
    expect(screen.getByText("1h ago")).toBeInTheDocument();
  });

  it("renders the hours branch for a mid-range value", () => {
    render(<ActivityList events={[makeEvent({ occurredAt: agoIso(300) })]} />);
    expect(screen.getByText("5h ago")).toBeInTheDocument();
  });

  it("renders the hours branch at the 23-hour boundary", () => {
    render(<ActivityList events={[makeEvent({ occurredAt: agoIso(23 * 60) })]} />);
    expect(screen.getByText("23h ago")).toBeInTheDocument();
  });

  it("renders the days branch at the 24-hour boundary", () => {
    render(<ActivityList events={[makeEvent({ occurredAt: agoIso(24 * 60) })]} />);
    expect(screen.getByText("1d ago")).toBeInTheDocument();
  });

  it("renders the days branch for a multi-day value", () => {
    render(<ActivityList events={[makeEvent({ occurredAt: agoIso(3 * 24 * 60) })]} />);
    expect(screen.getByText("3d ago")).toBeInTheDocument();
  });

  it("derives the relative time from occurredAt rather than a static value (#201)", () => {
    // Two renders 0 minutes apart with the same occurredAt should agree —
    // this just documents that the value comes from Date.now() - occurredAt
    // at render time, not from a field baked into the mock data.
    const occurredAt = agoIso(90);
    render(<ActivityList events={[makeEvent({ occurredAt })]} />);
    expect(screen.getByText("1h ago")).toBeInTheDocument();
  });
});
