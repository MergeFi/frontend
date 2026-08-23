/**
 * Tests for DashboardShell active-nav highlighting (#220).
 *
 * Before the fix, `pathname === item.href` meant a nested route such as
 * /issues/abc123 did not highlight "Bounty pipeline", so the sidebar looked
 * like nothing was selected whenever the user drilled into a child page.
 *
 * The expected behavior:
 * - Top-level sections (/issues, /milestones, /reputation/...) stay
 *   highlighted on their child routes.
 * - Dashboard overview links (/dashboard/...) still use exact matching so a
 *   nested route under an unrelated dashboard section does not keep the
 *   overview link permanently highlighted.
 */

import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "./DashboardShell";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockedUsePathname = usePathname as jest.Mock;

function renderMaintainerShell() {
  return render(
    <DashboardShell role="maintainer" title="Maintainer dashboard">
      <div>content</div>
    </DashboardShell>,
  );
}

function activeLink(name: string | RegExp) {
  return screen.getByRole("link", { name });
}

describe("DashboardShell — active nav highlighting (#220)", () => {
  it("highlights a top-level section on its exact route", () => {
    mockedUsePathname.mockReturnValue("/issues");
    renderMaintainerShell();

    expect(activeLink("Bounty pipeline")).toHaveClass("bg-indigo-50");
  });

  it("keeps a top-level section highlighted on a nested child route", () => {
    mockedUsePathname.mockReturnValue("/issues/abc123");
    renderMaintainerShell();

    expect(activeLink("Bounty pipeline")).toHaveClass("bg-indigo-50");
    expect(activeLink("Bounty pipeline")).toHaveAttribute("href", "/issues");
  });

  it("keeps Milestones highlighted on its nested child route", () => {
    mockedUsePathname.mockReturnValue("/milestones/planning-2026");
    renderMaintainerShell();

    expect(activeLink("Milestones")).toHaveClass("bg-indigo-50");
  });

  it("does not highlight unrelated sections while on a nested child route", () => {
    mockedUsePathname.mockReturnValue("/issues/abc123");
    renderMaintainerShell();

    expect(activeLink("Milestones")).not.toHaveClass("bg-indigo-50");
  });

  it("uses exact matching for dashboard overview links", () => {
    const { unmount } = renderMaintainerShell();
    mockedUsePathname.mockReturnValue("/dashboard/maintainer/other");

    // Neither the Overview nor Team link (both point at
    // /dashboard/maintainer) should remain active on a different nested
    // dashboard path.
    expect(activeLink("Overview")).not.toHaveClass("bg-indigo-50");
    expect(activeLink("Team")).not.toHaveClass("bg-indigo-50");
    unmount();
  });

  it("still highlights the dashboard overview link on its exact route", () => {
    mockedUsePathname.mockReturnValue("/dashboard/maintainer");
    renderMaintainerShell();

    expect(activeLink("Overview")).toHaveClass("bg-indigo-50");
  });
});
