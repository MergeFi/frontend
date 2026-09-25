import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CallbackClient } from "./CallbackClient";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/types";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockReplace = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedUseAuth = useAuth as jest.MockedFunction<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedUseSearchParams = useSearchParams as jest.MockedFunction<any>;
const mockedUseRouter = useRouter as jest.Mock;

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
    mockedUseRouter.mockReturnValue({ replace: mockReplace });
    mockedUseSearchParams.mockReturnValue(new URLSearchParams({ token: "jwt-token" }));
  });

  it("redirects maintainer to /dashboard/maintainer", async () => {
    const user = makeUser(["maintainer"]);
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(user),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/maintainer");
    });
  });

  it("redirects sponsor to /dashboard/sponsor", async () => {
    const user = makeUser(["sponsor"]);
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(user),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/sponsor");
    });
  });

  it("redirects contributor to /dashboard/contributor", async () => {
    const user = makeUser(["contributor"]);
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(user),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor");
    });
  });

  it("prefers maintainer over sponsor when user has multiple roles", async () => {
    const user = makeUser(["sponsor", "maintainer"]);
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(user),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/maintainer");
    });
  });

  it("falls back to contributor when roles array is empty", async () => {
    const user = makeUser([]);
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(user),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor");
    });
  });

  it("falls back to contributor when login returns null", async () => {
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(null),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor");
    });
  });

  it("uses the user returned by login, not a stale context value", async () => {
    const user = makeUser(["maintainer"]);
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(user),
    });
    render(<CallbackClient />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/maintainer");
    });
    // Verify login was called — the resolved user drives the redirect
    expect(mockedUseAuth.mock.results[0].value.login).toHaveBeenCalledWith("jwt-token");
  });

  it("shows error when no token is present", () => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams());
    mockedUseAuth.mockReturnValue({ login: jest.fn() });
    render(<CallbackClient />);
    expect(screen.getByText(/No token was returned/)).toBeInTheDocument();
  });
});
