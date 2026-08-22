import { render, screen } from "@testing-library/react";
import { DashboardShell } from "./DashboardShell";
import * as navigation from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("DashboardShell Component (#275)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders contributor role nav items and highlights active route", () => {
    (navigation.usePathname as jest.Mock).mockReturnValue("/dashboard/contributor");

    render(
      <DashboardShell role="contributor" title="Contributor Dashboard">
        <div>Content Area</div>
      </DashboardShell>,
    );

    expect(screen.getByText("Contributor Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Content Area")).toBeInTheDocument();

    const overviewLink = screen.getByRole("link", { name: /Overview/i });
    expect(overviewLink).toBeInTheDocument();
    expect(overviewLink).toHaveAttribute("href", "/dashboard/contributor");
    // Check active class styling
    expect(overviewLink).toHaveClass("bg-indigo-50");

    const browseLink = screen.getByRole("link", { name: /Browse bounties/i });
    expect(browseLink).toBeInTheDocument();
    expect(browseLink).toHaveAttribute("href", "/issues");
    expect(browseLink).not.toHaveClass("bg-indigo-50");

    expect(screen.getByRole("link", { name: /Reputation/i })).toBeInTheDocument();
  });

  it("renders maintainer role nav items", () => {
    (navigation.usePathname as jest.Mock).mockReturnValue("/milestones");

    render(
      <DashboardShell role="maintainer" title="Maintainer Dashboard">
        <div>Maintainer View</div>
      </DashboardShell>,
    );

    expect(screen.getByText("Maintainer Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bounty pipeline/i })).toHaveAttribute("href", "/issues");
    
    const milestoneLink = screen.getByRole("link", { name: /Milestones/i });
    expect(milestoneLink).toHaveAttribute("href", "/milestones");
    expect(milestoneLink).toHaveClass("bg-indigo-50");

    expect(screen.getByRole("link", { name: /Team/i })).toHaveAttribute("href", "/dashboard/maintainer");
  });

  it("renders sponsor role nav items", () => {
    (navigation.usePathname as jest.Mock).mockReturnValue("/dashboard/sponsor");

    render(
      <DashboardShell role="sponsor" title="Sponsor Dashboard">
        <div>Sponsor View</div>
      </DashboardShell>,
    );

    expect(screen.getByText("Sponsor Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bounties funded/i })).toHaveAttribute("href", "/issues");
    expect(screen.getByRole("link", { name: /Payments/i })).toHaveAttribute("href", "/dashboard/sponsor");
  });

  it("renders role switcher links with active role emphasized", () => {
    (navigation.usePathname as jest.Mock).mockReturnValue("/dashboard/contributor");

    render(
      <DashboardShell role="contributor" title="Contributor Dashboard">
        <div>Content</div>
      </DashboardShell>,
    );

    const contributorSwitcher = screen.getByRole("link", { name: "Contributor" });
    const maintainerSwitcher = screen.getByRole("link", { name: "Maintainer" });
    const sponsorSwitcher = screen.getByRole("link", { name: "Sponsor" });

    expect(contributorSwitcher).toHaveClass("font-medium");
    expect(maintainerSwitcher).toHaveClass("text-slate-500");
    expect(sponsorSwitcher).toHaveClass("text-slate-500");
  });
});
