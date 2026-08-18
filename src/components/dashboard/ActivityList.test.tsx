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

function makeEvent(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: "a1",
    handle: "devrel_ana",
    action: "was paid",
    target: "core-indexer#288",
    minutesAgo: 6,
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
});
