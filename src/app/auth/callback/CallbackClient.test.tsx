import React, { useState } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
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

/**
 * Creates a mock useAuth that starts with user: null and transitions
 * to the resolved user after login() is called, mirroring real
 * AuthContext behavior (login → refresh → setUser).
 */
function createAsyncAuthMock(resolvedUser: AuthUser) {
  let setUser: ((user: AuthUser | null) => void) | null = null;
  const loginMock = jest.fn().mockImplementation(() => {
    return new Promise<void>((resolve) => {
      // Trigger re-render with resolved user after login completes
      setTimeout(() => {
        act(() => {
          setUser?.(resolvedUser);
        });
        resolve();
      }, 0);
    });
  });

  return {
    loginMock,
    getAuthValue: () => ({
      login: loginMock,
      user: null as AuthUser | null,
      setUser: (fn: (prev: AuthUser | null) => AuthUser | null) => {
        setUser = (u) => fn(u);
      },
    }),
  };
}

describe("CallbackClient — role-based redirect (issue #77)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ replace: mockReplace });
    mockedUseSearchParams.mockReturnValue(new URLSearchParams({ token: "jwt-token" }));
  });

  it("redirects maintainer to /dashboard/maintainer after async login", async () => {
    const { loginMock, getAuthValue } = createAsyncAuthMock(makeUser(["maintainer"]));
    // Simulate AuthContext behavior: user starts null, becomes populated after login
    let currentUser: AuthUser | null = null;
    const authValue = getAuthValue();
    authValue.setUser((prev: AuthUser | null) => prev);

    mockedUseAuth.mockImplementation(() => ({
      ...authValue,
      get user() { return currentUser; },
    }));

    // Simulate AuthContext's setUser call after login resolves
    const originalSetUser = authValue.setUser;
    authValue.setUser = (fn: (prev: AuthUser | null) => AuthUser | null) => {
      currentUser = fn(currentUser);
    };

    render(<CallbackClient />);

    // Wait for login to resolve and trigger re-render
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/maintainer");
    });
  });

  it("redirects sponsor to /dashboard/sponsor after async login", async () => {
    const { loginMock, getAuthValue } = createAsyncAuthMock(makeUser(["sponsor"]));
    let currentUser: AuthUser | null = null;
    const authValue = getAuthValue();
    authValue.setUser = (fn: (prev: AuthUser | null) => AuthUser | null) => {
      currentUser = fn(currentUser);
    };

    mockedUseAuth.mockImplementation(() => ({
      ...authValue,
      get user() { return currentUser; },
    }));

    render(<CallbackClient />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/sponsor");
    });
  });

  it("redirects contributor to /dashboard/contributor after async login", async () => {
    const { loginMock, getAuthValue } = createAsyncAuthMock(makeUser(["contributor"]));
    let currentUser: AuthUser | null = null;
    const authValue = getAuthValue();
    authValue.setUser = (fn: (prev: AuthUser | null) => AuthUser | null) => {
      currentUser = fn(currentUser);
    };

    mockedUseAuth.mockImplementation(() => ({
      ...authValue,
      get user() { return currentUser; },
    }));

    render(<CallbackClient />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor");
    });
  });

  it("prefers maintainer over sponsor when user has multiple roles", async () => {
    const { loginMock, getAuthValue } = createAsyncAuthMock(makeUser(["sponsor", "maintainer"]));
    let currentUser: AuthUser | null = null;
    const authValue = getAuthValue();
    authValue.setUser = (fn: (prev: AuthUser | null) => AuthUser | null) => {
      currentUser = fn(currentUser);
    };

    mockedUseAuth.mockImplementation(() => ({
      ...authValue,
      get user() { return currentUser; },
    }));

    render(<CallbackClient />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/maintainer");
    });
  });

  it("falls back to contributor when roles array is empty", async () => {
    const { loginMock, getAuthValue } = createAsyncAuthMock(makeUser([]));
    let currentUser: AuthUser | null = null;
    const authValue = getAuthValue();
    authValue.setUser = (fn: (prev: AuthUser | null) => AuthUser | null) => {
      currentUser = fn(currentUser);
    };

    mockedUseAuth.mockImplementation(() => ({
      ...authValue,
      get user() { return currentUser; },
    }));

    render(<CallbackClient />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor");
    });
  });

  it("falls back to contributor when user remains null after login", async () => {
    // Test case where login succeeds but user is still null (no roles)
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
