/**
 * MaintainerDashboardPage — mock-vs-live display contract (#944).
 *
 * The maintainer page is a Server Component with no AuthContext access, so
 * the `degraded` session guard that covers the client dashboards cannot
 * apply here. The same three-way distinction is covered through the page's
 * own fallback path: a mock fallback must present sample data honestly
 * (error-typed stats, never fabricated live figures), while a live fetch
 * shows loaded values.
 */
import { render, screen } from "@testing-library/react";
import MaintainerDashboardPage from "./page";

const mockFetchBounties = jest.fn();
const mockFetchMyRepositories = jest.fn();
jest.mock("@/lib/api", () => ({
  fetchBounties: (...args: unknown[]) => mockFetchBounties(...args),
  fetchMyRepositories: (...args: unknown[]) => mockFetchMyRepositories(...args),
}));

jest.mock("@/components/dashboard/DashboardShell", () => ({
  DashboardShell: ({ children, badge }: any) => (
    <div data-testid="dashboard-shell">
      {badge}
      {children}
    </div>
  ),
}));
jest.mock("@/components/dashboard/ActivityList", () => ({
  ActivityList: () => <div data-testid="activity-list" />,
}));
jest.mock("@/components/ui/StatCard", () => ({
  StatCard: ({ label, status, value }: any) => (
    <div data-testid="stat-card" data-label={label} data-status={status}>
      {status === "loaded" && value !== undefined ? String(value) : ""}
    </div>
  ),
}));
jest.mock("@/components/ui/Badge", () => ({
  StatusBadge: () => <div data-testid="status-badge" />,
}));
jest.mock("@/components/ui/EmptyState", () => ({
  EmptyState: () => <div data-testid="empty-state" />,
}));
jest.mock("@/components/ui/DataSourceNotice", () => ({
  SampleDataChip: () => <div data-testid="sample-data-chip" />,
}));
jest.mock("@/components/ui/Avatar", () => ({
  Avatar: () => <div data-testid="avatar" />,
}));
jest.mock("@/components/ui/Card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));
jest.mock("./PipelineBoard", () => ({
  PipelineBoard: () => <div data-testid="pipeline-board" />,
  ESCROW_LOCKED_EXCLUDED_STATUSES: [],
}));
jest.mock("./GitHubSyncPanel", () => ({
  GitHubSyncPanel: () => <div data-testid="github-sync-panel" />,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchMyRepositories.mockResolvedValue([{ org: "acme", repo: "api" }]);
});

describe("MaintainerDashboardPage — mock-vs-live display contract (#944)", () => {
  it("presents mock fallback honestly: error-typed stats and no fabricated live figures", async () => {
    mockFetchBounties.mockResolvedValue({
      data: [
        { org: "acme", repo: "api", status: "open", reward: 100 },
        { org: "acme", repo: "api", status: "in_review", reward: 250 },
      ],
      source: "mock",
    });

    render(await MaintainerDashboardPage());

    const statCards = screen.getAllByTestId("stat-card");
    statCards.forEach((card) => {
      expect(card).toHaveAttribute("data-status", "error");
      expect(card).toHaveTextContent("");
    });
    expect(screen.queryByText(/live data/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("sample-data-chip")).toBeInTheDocument();
  });

  it("shows loaded values when the fetch is live", async () => {
    mockFetchBounties.mockResolvedValue({
      data: [{ org: "acme", repo: "api", status: "open", reward: 100 }],
      source: "live",
    });

    render(await MaintainerDashboardPage());

    const statCards = screen.getAllByTestId("stat-card");
    statCards.forEach((card) => {
      expect(card).toHaveAttribute("data-status", "loaded");
    });
  });
});
