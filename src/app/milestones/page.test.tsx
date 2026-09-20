import React from "react";
import { render, screen } from "@testing-library/react";
import MilestonesPage from "./page";
import { fetchMilestones, fetchMaintenancePools } from "@/lib/api";
import type { Milestone, MaintenancePool } from "@/types";

jest.mock("@/lib/api", () => ({
  fetchMilestones: jest.fn(),
  fetchMaintenancePools: jest.fn(),
}));

jest.mock("./MilestoneActions", () => ({
  MilestoneFundButton: () => <button>Mock Fund Button</button>,
  PoolDepositButton: () => <button>Mock Deposit Button</button>,
}));

const mockFetchMilestones = fetchMilestones as jest.Mock;
const mockFetchMaintenancePools = fetchMaintenancePools as jest.Mock;

describe("MilestonesPage (#401)", () => {
  beforeEach(() => {
    mockFetchMilestones.mockReset();
    mockFetchMaintenancePools.mockReset();
    mockFetchMaintenancePools.mockResolvedValue({ data: [] });
  });

  it("renders empty state when there are no milestones", async () => {
    mockFetchMilestones.mockResolvedValue({ data: [] });

    const ui = await MilestonesPage();
    render(ui);

    expect(screen.getByText("No milestones yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Milestones will appear here once sponsors create them for open source releases."
      )
    ).toBeInTheDocument();
  });

  it("handles unfunded milestone with budget <= 0 without divide-by-zero, rendering 'Not yet funded' and 0% progress width", async () => {
    const unfundedMilestone: Milestone = {
      id: "m-unfunded",
      repo: "stellar/soroban-example",
      name: "v1.0.0 Zero Budget",
      budget: 0,
      distributed: 0,
      asset: "USDC",
      issueCount: 5,
      completedCount: 0,
    };

    mockFetchMilestones.mockResolvedValue({ data: [unfundedMilestone] });

    const ui = await MilestonesPage();
    const { container } = render(ui);

    expect(screen.getByText("Not yet funded")).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/i)).not.toBeInTheDocument();

    const progressBar = container.querySelector('[style*="width: 0%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("handles over-funded milestone (distributed > budget) by displaying 'Over-funded' and clamping progress bar to 100%", async () => {
    const overfundedMilestone: Milestone = {
      id: "m-overfunded",
      repo: "stellar/soroban-example",
      name: "v2.0.0 Surplus Release",
      budget: 1000,
      distributed: 1500,
      asset: "USDC",
      issueCount: 10,
      completedCount: 10,
    };

    mockFetchMilestones.mockResolvedValue({ data: [overfundedMilestone] });

    const ui = await MilestonesPage();
    const { container } = render(ui);

    expect(screen.getByText("Over-funded")).toBeInTheDocument();
    expect(screen.queryByText("150%")).not.toBeInTheDocument();

    // Clamped width must be exactly 100%
    const progressBar = container.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("renders standard in-progress milestone with formatted percentage and proportional progress bar width", async () => {
    const normalMilestone: Milestone = {
      id: "m-normal",
      repo: "stellar/soroban-example",
      name: "v3.0.0 Mid Progress",
      budget: 2000,
      distributed: 1000,
      asset: "USDC",
      issueCount: 8,
      completedCount: 4,
    };

    mockFetchMilestones.mockResolvedValue({ data: [normalMilestone] });

    const ui = await MilestonesPage();
    const { container } = render(ui);

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("4 of 8 issues complete")).toBeInTheDocument();

    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("renders maintenance pools correctly when provided", async () => {
    const samplePool: MaintenancePool = {
      id: "pool-1",
      repo: "stellar/rs-soroban-sdk",
      balance: 5000,
      monthlyDeposit: 500,
      asset: "USDC",
    };

    mockFetchMilestones.mockResolvedValue({ data: [] });
    mockFetchMaintenancePools.mockResolvedValue({ data: [samplePool] });

    const ui = await MilestonesPage();
    render(ui);

    expect(screen.getByText("stellar/rs-soroban-sdk")).toBeInTheDocument();
    expect(screen.getByText("$5,000 balance")).toBeInTheDocument();
    expect(screen.getByText("$500 deposited monthly")).toBeInTheDocument();
  });
});
