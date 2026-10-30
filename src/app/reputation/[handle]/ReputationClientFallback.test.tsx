import { render, screen, waitFor } from "@testing-library/react";
import { ReputationClientFallback } from "./ReputationClientFallback";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { notFound } from "next/navigation";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  apiRequest: jest.fn(),
}));

describe("ReputationClientFallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state while auth is loading", () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: true });

    render(<ReputationClientFallback handle="alice" />);
    expect(screen.queryByText("@alice")).not.toBeInTheDocument();
  });

  it("triggers notFound when user is not logged in", async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });

    render(<ReputationClientFallback handle="alice" />);

    await waitFor(() => {
      expect(notFound).toHaveBeenCalled();
    });
  });

  it("triggers notFound when logged in user handle does not match", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "u1", username: "bob", avatarUrl: null },
      loading: false,
    });

    render(<ReputationClientFallback handle="alice" />);

    await waitFor(() => {
      expect(notFound).toHaveBeenCalled();
    });
  });

  it("fetches and renders profile when handle matches logged-in user", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "u1", username: "alice", avatarUrl: "https://example.com/avatar.png" },
      loading: false,
    });

    (apiRequest as jest.Mock).mockResolvedValue({
      totalEarnings: "500",
      mergedPrCount: 4,
      completionRate: "100",
      avgReviewTimeHours: "12",
      onTimeDeliveryPercentage: "95",
      languages: { TypeScript: 10 },
      orgsContributedTo: ["stellar"],
    });

    render(<ReputationClientFallback handle="alice" />);

    await waitFor(() => {
      expect(screen.getByText("@alice")).toBeInTheDocument();
    });
    expect(notFound).not.toHaveBeenCalled();
  });
});
