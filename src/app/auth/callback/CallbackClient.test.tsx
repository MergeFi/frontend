import { render, screen, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CallbackClient } from "./CallbackClient";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser, UserRole } from "@/types";

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

function makeUser(roles: UserRole[], stellarAddress: string | null = "GWALLET"): AuthUser {
  return {
    id: "1",
    username: "testuser",
    displayName: "Test User",
    avatarUrl: null,
    roles,
    stellarAddress,
  };
}

function mockSearchParams(token: string | null, code: string | null = null) {
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (code) params.set("code", code);
  mockedUseSearchParams.mockReturnValue(params);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ replace: mockReplace });
  mockSearchParams("jwt-token");
});

/**
 * Creates a mock useAuth that starts with user: null and transitions
 * to the resolved user after login() is called, mirroring real
 * AuthContext behavior (login → refresh → setUser).
 */
function createAsyncAuthMock(resolvedUser: AuthUser | null) {
  let resolveLogin: (user: AuthUser | null) => void = () => {};
  const loginPromise = new Promise<AuthUser | null>((resolve) => {
    resolveLogin = resolve;
  });

  const login = jest.fn().mockImplementation(() => loginPromise);

  const getAuthValue = () => ({
    user: null,
    loading: false,
    degraded: false,
    login,
    logout: jest.fn(),
    refresh: jest.fn(),
  });

  return {
    getAuthValue,
    resolveLogin: () => resolveLogin(resolvedUser),
    login,
  };
}

describe("CallbackClient — role-based redirect (#77)", () => {
  it("redirects maintainer to /dashboard/maintainer after async login", async () => {
    const { getAuthValue, resolveLogin, login } = createAsyncAuthMock(makeUser(["maintainer"]));
    mockedUseAuth.mockReturnValue(getAuthValue());

    render(<CallbackClient />);

    resolveLogin();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/maintainer"),
    );
    expect(login).toHaveBeenCalledWith("jwt-token");
  });

  it("redirects sponsor to /dashboard/sponsor after async login", async () => {
    const { getAuthValue, resolveLogin, login } = createAsyncAuthMock(makeUser(["sponsor"]));
    mockedUseAuth.mockReturnValue(getAuthValue());

    render(<CallbackClient />);

    resolveLogin();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/sponsor"),
    );
    expect(login).toHaveBeenCalledWith("jwt-token");
  });

  it("redirects contributor to /dashboard/contributor after async login", async () => {
    const { getAuthValue, resolveLogin, login } = createAsyncAuthMock(makeUser(["contributor"]));
    mockedUseAuth.mockReturnValue(getAuthValue());

    render(<CallbackClient />);

    resolveLogin();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor"),
    );
    expect(login).toHaveBeenCalledWith("jwt-token");
  });

  it("prefers maintainer over sponsor when user has multiple roles", async () => {
    const { getAuthValue, resolveLogin, login } = createAsyncAuthMock(
      makeUser(["maintainer", "sponsor"]),
    );
    mockedUseAuth.mockReturnValue(getAuthValue());

    render(<CallbackClient />);

    resolveLogin();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/maintainer"),
    );
    expect(login).toHaveBeenCalledWith("jwt-token");
  });

  it("handles code-based handoff flow (#591)", async () => {
    const loginMock = jest.fn().mockResolvedValue(makeUser(["contributor"]));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accessToken: "exchanged-token" }),
    }) as jest.Mock;

    mockedUseAuth.mockReturnValue({
      login: loginMock,
      user: null,
      loading: false,
      degraded: false,
      logout: jest.fn(),
      refresh: jest.fn(),
    });

    mockSearchParams(null, "handoff-code");

    render(<CallbackClient />);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "handoff-code" }),
      }),
    );
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith("exchanged-token"));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor"));
  });
});

describe("CallbackClient — unfinished wallet link (#456)", () => {
  it("returns to /connect when the resolved user has no payout wallet", async () => {
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(makeUser(["maintainer"], null)),
    });

    render(<CallbackClient />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/connect"),
    );
  });

  it("falls back to contributor when user has no roles", async () => {
    mockedUseAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue(makeUser([])),
    });

    render(<CallbackClient />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/contributor"),
    );
  });
});

describe("CallbackClient — failure paths", () => {
  it("surfaces an error instead of landing on a demo dashboard when login resolves null", async () => {
    mockedUseAuth.mockReturnValue({ login: jest.fn().mockResolvedValue(null) });

    render(<CallbackClient />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Could not complete sign-in/,
      ),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows an error when no token is present", async () => {
    mockSearchParams(null);
    mockedUseAuth.mockReturnValue({ login: jest.fn() });

    render(<CallbackClient />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /No token was returned by GitHub sign-in/,
      ),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("strips the token from the URL before it can reach browser history (#9)", () => {
    mockSearchParams("secret-jwt-token");
    mockedUseAuth.mockReturnValue({ login: jest.fn().mockResolvedValue(makeUser([])) });
    const replaceState = jest.spyOn(window.history, "replaceState");

    render(<CallbackClient />);

    expect(replaceState).toHaveBeenCalled();
    const call = replaceState.mock.calls[0];
    const rewritten = String(call?.[2] ?? "");
    expect(rewritten).not.toContain("token");
    expect(rewritten).not.toContain("?");
  });
});
