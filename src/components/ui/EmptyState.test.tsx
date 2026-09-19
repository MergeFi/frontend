import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";
import { Inbox } from "lucide-react";

describe("EmptyState Component", () => {
  it("renders title, description and icon with proper accessibility attributes", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No items found"
        description="Try adjusting your search criteria"
      />
    );

    expect(screen.getByText("No items found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search criteria")).toBeInTheDocument();
  });

  it("renders optional action button/node when passed", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No bounties yet"
        description="Create your first bounty to get started"
        action={<button data-testid="cta-btn">Create Bounty</button>}
      />
    );

    expect(screen.getByTestId("cta-btn")).toBeInTheDocument();
    expect(screen.getByText("Create Bounty")).toBeInTheDocument();
  });

  it("does not render action container when action is omitted", () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="Nothing here"
        description="Check back later"
      />
    );

    expect(container.querySelector(".mt-4")).toBeNull();
  });
});
