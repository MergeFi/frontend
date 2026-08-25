/**
 * Navbar.test.tsx (#276)
 *
 * Covers the three rendering branches: loading (renders nothing in the
 * user-actions area), signed-out (Connect GitHub + Sign in buttons),
 * and signed-in (avatar, display name, log-out button). Also verifies
 * the "Reputation" link only appears when a user is authenticated.
 */

import { render, screen } from "@testing-library/react";
import { Navbar } from "./Navbar";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/ui/NetworkBadge", () => ({
  NetworkBadge: () => <span data-testid="network-badge" />,
}));

jest.mock("@/components/ui/ThemeToggle", () => ({
  ThemeToggle: () => <span data-testid="theme-toggle" />,
}));

jest.mock("@/components/ui/Avatar", () => ({
  Avatar: ({ seed }: { seed: string }) => <span data-testid="avatar" data-seed={seed} />,
}));

jest.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props}>{children}</button>
  ),
}));

const { useAuth } = require("@/context/AuthContext");

function mockAuth(overrides: Partial<{ user: any; loading: boolean; logout: jest.fn }>) {
  useAuth.mockReturnValue({
    user: null,
    loading: false,
    logout: jest.fn(),
    ...overrides,
  });
}

describe("Navbar — loading state (#276)", () => {
  it("renders nothing in the user-actions area while loading", () => {
    mockAuth({ user: null, loading: true });
    render(<Navbar />);
    expect(screen.queryByRole("button", { name: /connect github/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });
});

describe("Navbar — signed out", () => {
  it("renders Connect GitHub and Sign in buttons when not authenticated", () => {
    mockAuth({ user: null, loading: false });
    render(<Navbar />);
    expect(screen.getByRole("button", { name: /connect github/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("does not render the Reputation link when signed out", () => {
    mockAuth({ user: null, loading: false });
    render(<Navbar />);
    expect(screen.queryByText("Reputation")).not.toBeInTheDocument();
  });

  it("does not render a log-out button when signed out", () => {
    mockAuth({ user: null, loading: false });
    render(<Navbar />);
    expect(screen.queryByTitle("Sign out")).not.toBeInTheDocument();
  });
});

describe("Navbar — signed in", () => {
  const fakeUser = {
    id: "u1",
    username: "octocat",
    displayName: "The Octocat",
    avatarUrl: "https://example.com/avatar.png",
    roles: ["contributor"],
    stellarAddress: null,
  };

  it("renders the user's display name and avatar when authenticated", () => {
    mockAuth({ user: fakeUser, loading: false });
    render(<Navbar />);
    expect(screen.getByText("The Octocat")).toBeInTheDocument();
    expect(screen.getByTestId("avatar")).toHaveAttribute("data-seed", "octocat");
  });

  it("falls back to username when displayName is null", () => {
    mockAuth({ user: { ...fakeUser, displayName: null }, loading: false });
    render(<Navbar />);
    expect(screen.getByText("octocat")).toBeInTheDocument();
  });

  it("renders the log-out button when signed in", () => {
    mockAuth({ user: fakeUser, loading: false });
    render(<Navbar />);
    expect(screen.getByTitle("Sign out")).toBeInTheDocument();
  });

  it("renders the Reputation link when signed in", () => {
    mockAuth({ user: fakeUser, loading: false });
    render(<Navbar />);
    const repLinks = screen.getAllByText("Reputation");
    expect(repLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("does not render Connect GitHub or Sign in buttons when signed in", () => {
    mockAuth({ user: fakeUser, loading: false });
    render(<Navbar />);
    expect(screen.queryByRole("button", { name: /connect github/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in$/i })).not.toBeInTheDocument();
  });
});
