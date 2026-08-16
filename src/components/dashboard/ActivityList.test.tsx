import { render, screen } from "@testing-library/react";
import { ActivityList } from "./ActivityList";
import type { ActivityEvent } from "@/lib/mock-data";

const baseEvent: ActivityEvent = {
  id: "zero-adjustment",
  handle: "devrel_ana",
  action: "resolved",
  target: "mergefi#87",
  minutesAgo: 6,
};

describe("ActivityList", () => {
  it("renders a zero amount as formatted currency instead of a bare text node", () => {
    render(
      <ActivityList
        events={[
          {
            ...baseEvent,
            amount: 0,
            asset: "USDC",
          },
        ]}
      />,
    );

    expect(screen.getByText("0 USDC")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("omits the amount when it is undefined", () => {
    render(<ActivityList events={[baseEvent]} />);

    expect(screen.queryByText(/USDC|XLM/)).not.toBeInTheDocument();
    expect(screen.getByText("6m ago")).toBeInTheDocument();
  });

  it("keeps positive amounts formatted as before", () => {
    render(<ActivityList events={[{ ...baseEvent, amount: 50, asset: "USDC" }]} />);

    expect(screen.getByText("50 USDC")).toBeInTheDocument();
  });
});
