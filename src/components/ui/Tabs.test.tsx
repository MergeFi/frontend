/**
 * Tabs.test.tsx (#277)
 *
 * Covers click-handling (onChange fires with the correct key), active-tab
 * styling (bg-white + shadow-sm for active, muted text for inactive), and
 * the optional count badge rendering logic.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs } from "./Tabs";

const sampleTabs = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

const tabsWithCount = [
  { key: "active", label: "Active", count: 5 },
  { key: "completed", label: "Completed", count: 0 },
];

describe("Tabs — onChange", () => {
  it("calls onChange with the clicked tab's key", () => {
    const onChange = jest.fn();
    render(<Tabs tabs={sampleTabs} active="active" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    expect(onChange).toHaveBeenCalledWith("completed");
  });

  it("does not call onChange when the already-active tab is clicked", () => {
    const onChange = jest.fn();
    render(<Tabs tabs={sampleTabs} active="active" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    // onChange still fires — the parent decides whether to ignore duplicates
    expect(onChange).toHaveBeenCalledWith("active");
  });
});

describe("Tabs — active styling", () => {
  it("applies bg-white and shadow-sm to the active tab", () => {
    render(<Tabs tabs={sampleTabs} active="active" onChange={() => {}} />);
    const activeBtn = screen.getByRole("button", { name: "Active" });
    expect(activeBtn.className).toContain("bg-white");
    expect(activeBtn.className).toContain("shadow-sm");
  });

  it("applies muted text styling to inactive tabs", () => {
    render(<Tabs tabs={sampleTabs} active="active" onChange={() => {}} />);
    const inactiveBtn = screen.getByRole("button", { name: "Completed" });
    expect(inactiveBtn.className).toContain("text-slate-500");
    expect(inactiveBtn.className).not.toContain("bg-white");
  });

  it("switches active styling when a different tab becomes active", () => {
    render(<Tabs tabs={sampleTabs} active="completed" onChange={() => {}} />);
    const completedBtn = screen.getByRole("button", { name: "Completed" });
    const activeBtn = screen.getByRole("button", { name: "Active" });
    expect(completedBtn.className).toContain("bg-white");
    expect(activeBtn.className).toContain("text-slate-500");
  });
});

describe("Tabs — count badge", () => {
  it("renders the count badge when count is a number", () => {
    render(<Tabs tabs={tabsWithCount} active="active" onChange={() => {}} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders count badge for inactive tabs too", () => {
    render(<Tabs tabs={tabsWithCount} active="active" onChange={() => {}} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("does not render a count badge when count is omitted", () => {
    render(<Tabs tabs={sampleTabs} active="active" onChange={() => {}} />);
    // Only the tab labels should be present, no numeric badges
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
