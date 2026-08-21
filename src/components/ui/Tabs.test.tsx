import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs } from "./Tabs";

describe("Tabs component (#277)", () => {
  const tabs = [
    { key: "active", label: "Active", count: 3 },
    { key: "completed", label: "Completed", count: 0 },
    { key: "all", label: "All" },
  ];

  it("renders all tab labels correctly", () => {
    render(<Tabs tabs={tabs} active="active" onChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: /Active/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Completed/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All/i })).toBeInTheDocument();
  });

  it("calls onChange with the clicked tab key", () => {
    const handleChange = jest.fn();
    render(<Tabs tabs={tabs} active="active" onChange={handleChange} />);

    const completedTab = screen.getByRole("button", { name: /Completed/i });
    fireEvent.click(completedTab);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("completed");
  });

  it("applies active styles to the active tab and inactive styles to others", () => {
    render(<Tabs tabs={tabs} active="active" onChange={jest.fn()} />);

    const activeBtn = screen.getByRole("button", { name: /Active/i });
    const completedBtn = screen.getByRole("button", { name: /Completed/i });

    expect(activeBtn).toHaveClass("bg-white", "text-slate-900");
    expect(completedBtn).toHaveClass("text-slate-500");
  });

  it("renders count badge only when tab.count is a number (including 0)", () => {
    render(<Tabs tabs={tabs} active="active" onChange={jest.fn()} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    // 'all' has no count, so only 2 count badges exist
    const badges = screen.getAllByText(/^[0-9]+$/);
    expect(badges).toHaveLength(2);
  });
});
