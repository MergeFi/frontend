import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { CallbackClient } from "./CallbackClient";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/types";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockReplace = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedUseAuth = useAuth as jest.MockedFunction<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedUseSearchParams = useSearchParams as jest.MockedFunction<any>;

function makeUser(roles: string[]): AuthUser {
  return {
    id: "1",
    username: "testuser",
    displayName: "Test User",
    avatarUrl: null,
    roles: roles as AuthUser["roles"],
    stellarAddress: null,
  };
}

describe("CallbackClient — role-based redirect (issue #77)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (require("next/navigation").useRouter = () => ({ replace: mockReplace }));
    mockedUseSearchParams.mockReturnValue(new URLSearchParams({ token: "jwt-token" }));
  });

  it("redirects maintainer to /dashboard/maintainer", async () => {
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(undefined),
      user: makeUser(["maintainer"]),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/maintainer");
    });
  });

  it("redirects sponsor to /dashboard/sponsor", async () => {
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(undefined),
      user: makeUser(["sponsor"]),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/sponsor");
    });
  });

  it("redirects contributor to /dashboard/contributor", async () => {
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(undefined),
      user: makeUser(["contributor"]),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor");
    });
  });

  it("prefers maintainer over sponsor when user has multiple roles", async () => {
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(undefined),
      user: makeUser(["sponsor", "maintainer"]),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/maintainer");
    });
  });

  it("falls back to contributor when roles array is empty", async () => {
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(undefined),
      user: makeUser([]),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor");
    });
  });

  it("falls back to contributor when user is null", async () => {
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(undefined),
      user: null,
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor");
    });
  });

  it("shows error when no token is present", () => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams());
    mockedUseAuth.mockReturnValue({ login: jest.fn(), user: null });
    render(<CallbackClient />);
    expect(screen.getByText(/No token was returned/)).toBeInTheDocument();
  });
});
