import { render, screen, fireEvent } from "@testing-library/react";
import { Navbar } from "./Navbar";
import * as AuthContext from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

function renderNavbar() {
  return render(
    <ThemeProvider>
      <Navbar />
    </ThemeProvider>,
  );
}

describe("Navbar Component (#276)", () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state (no auth buttons or user info mounted)", () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByText("MergeFi")).toBeInTheDocument();
    expect(screen.getByText("Bounties")).toBeInTheDocument();
    expect(screen.getByText("Milestones")).toBeInTheDocument();
    expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect GitHub")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Sign out")).not.toBeInTheDocument();
    expect(screen.queryByText("Reputation")).not.toBeInTheDocument();
  });

  it("renders signed-out state with Sign in and Connect GitHub buttons", () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.getByText("Connect GitHub")).toBeInTheDocument();
    expect(screen.queryByTitle("Sign out")).not.toBeInTheDocument();
    expect(screen.queryByText("Reputation")).not.toBeInTheDocument();
  });

  it("renders signed-in user state with display name, avatar link, reputation and logout button", () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      user: {
        username: "alice_dev",
        displayName: "Alice Developer",
        avatarUrl: "https://example.com/alice.png",
      },
      loading: false,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByText("Alice Developer")).toBeInTheDocument();
    expect(screen.getByText("Reputation")).toBeInTheDocument();
    expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect GitHub")).not.toBeInTheDocument();

    const signOutBtn = screen.getByTitle("Sign out");
    expect(signOutBtn).toBeInTheDocument();

    fireEvent.click(signOutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renders dashboard links inside dropdown", () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      logout: mockLogout,
    });

    renderNavbar();

    expect(screen.getByText("Contributor")).toHaveAttribute("href", "/dashboard/contributor");
    expect(screen.getByText("Maintainer")).toHaveAttribute("href", "/dashboard/maintainer");
    expect(screen.getByText("Sponsor")).toHaveAttribute("href", "/dashboard/sponsor");
  });
});
