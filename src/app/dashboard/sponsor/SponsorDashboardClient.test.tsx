import { render, screen, waitFor } from "@testing-library/react";
import SponsorDashboardClient from "./SponsorDashboardClient";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { mockSponsorSummary } from "@/lib/mock-data";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/components/dashboard/DashboardShell", () => ({
  DashboardShell: ({ children, title, subtitle, badge }: any) => (
    <div data-testid="dashboard-shell">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div>{badge}</div>
      {children}
    </div>
  ),
}));

jest.mock("@/components/bounty/BountyCard", () => ({
  BountyCard: ({ bounty }: any) => <div data-testid="bounty-card">{bounty.title}</div>,
}));

describe("SponsorDashboardClient Component", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...process.env, NODE_ENV: originalEnv };
  });

  it("renders demo mode with mock data when user is signed out", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<SponsorDashboardClient />);

    expect(screen.getAllByText(mockSponsorSummary.name).length).toBeGreaterThan(0);
    expect(screen.getByText(/Showing sample data for now/i)).toBeInTheDocument();
    expect(screen.getByText("Demo data")).toBeInTheDocument();
    expect(screen.getByText("26,700 USDC")).toBeInTheDocument();
  });

  it("fetches and displays live dashboard data when user is logged in", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "sponsor-1", username: "octosponsor", displayName: "Octo Sponsor" },
      loading: false,
    });

    const rawApiResponse = {
      activeBounties: [
        {
          id: "b-1",
          title: "Optimize SQL Indexes",
          amount: 500,
          currency: "USDC",
          status: "funded",
          repo: { org: "AcmeCorp", name: "Backend" },
        },
        {
          id: "b-2",
          title: "Fix Token Expiry",
          amount: 300,
          currency: "USDC",
          status: "open",
          repo: { org: "AcmeCorp", name: "Backend" },
        },
        {
          id: "b-3",
          title: "Mobile Layout Fix",
          amount: 400,
          currency: "USDC",
          status: "open",
          repo: { org: "AcmeCorp", name: "MobileApp" },
        },
      ],
      totalSpent: 12000,
      budgetLocked: 1200,
      activeMilestones: [],
    };

    (apiRequest as jest.Mock).mockResolvedValue(rawApiResponse);

    render(<SponsorDashboardClient />);

    await waitFor(() => {
      expect(screen.getByText("Live data")).toBeInTheDocument();
    });

    expect(screen.getByText("Octo Sponsor's sponsorships")).toBeInTheDocument();
    expect(screen.getByText("12,000 USDC")).toBeInTheDocument();
    expect(screen.getByText("1,200 USDC")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // active bounty count
  });

  it("sets fetchStatus to error and keeps data null on api failure (error-vs-zero distinction)", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "sponsor-err", username: "erruser" },
      loading: false,
    });

    (apiRequest as jest.Mock).mockRejectedValue(new Error("API network failure"));

    render(<SponsorDashboardClient />);

    await waitFor(() => {
      const errorElements = screen.getAllByText(/Error loading data/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });

    expect(screen.getByText("erruser's sponsorships")).toBeInTheDocument();
  });
});
