import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { TOKEN_KEY } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/types";

jest.mock("@/lib/api", () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const PROFILE: AuthUser = {
  id: "user-1",
  username: "alice",
  displayName: "Alice",
  avatarUrl: null,
  roles: [],
  stellarAddress: null,
};

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="state">
        {loading ? "loading" : user ? `signed-in:${user.username}` : "signed-out"}
      </div>
      <button onClick={() => void login("new-token")}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function dispatchTokenStorageEvent(newValue: string | null) {
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: TOKEN_KEY,
      newValue,
      storageArea: window.localStorage,
    }),
  );
}

beforeEach(() => {
  window.localStorage.clear();
  mockApiRequest.mockReset();
});

describe("AuthContext — cross-tab sync (issue #84)", () => {
  it("signs the user out when another tab clears the token", async () => {
    window.localStorage.setItem(TOKEN_KEY, "token-a");
    mockApiRequest.mockImplementation(async (path: string) => {
      if (path === "/auth/me") return { userId: "user-1", username: "alice" };
      return PROFILE;
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-in:alice"),
    );

    act(() => {
      dispatchTokenStorageEvent(null);
    });

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-out"),
    );
  });

  it("re-resolves the session when another tab sets a new token", async () => {
    mockApiRequest.mockImplementation(async (path: string) => {
      if (path === "/auth/me") return { userId: "user-1", username: "alice" };
      return PROFILE;
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-out"),
    );

    act(() => {
      // A real browser's storage event fires only in other tabs, after that
      // tab's own localStorage.setItem() has already applied to the shared,
      // same-origin backing store — so the write is reflected here too.
      window.localStorage.setItem(TOKEN_KEY, "token-from-other-tab");
      dispatchTokenStorageEvent("token-from-other-tab");
    });

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-in:alice"),
    );
    expect(mockApiRequest).toHaveBeenCalledWith("/auth/me");
  });

  it("ignores storage events for unrelated keys", async () => {
    window.localStorage.setItem(TOKEN_KEY, "token-a");
    mockApiRequest.mockImplementation(async (path: string) => {
      if (path === "/auth/me") return { userId: "user-1", username: "alice" };
      return PROFILE;
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-in:alice"),
    );
    const callCountBefore = mockApiRequest.mock.calls.length;

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "mergefi_wallet_address",
          newValue: "GABC...",
          storageArea: window.localStorage,
        }),
      );
    });

    expect(mockApiRequest.mock.calls.length).toBe(callCountBefore);
    expect(screen.getByTestId("state")).toHaveTextContent("signed-in:alice");
  });
});

describe("AuthContext — session hydration (#232)", () => {
  it("refresh(): resolves /auth/me then /users/:id and sets user when a token is stored", async () => {
    window.localStorage.setItem(TOKEN_KEY, "token-a");
    mockApiRequest.mockImplementation(async (path: string) => {
      if (path === "/auth/me") return { userId: "user-1", username: "alice" };
      expect(path).toBe("/users/user-1");
      return PROFILE;
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-in:alice"),
    );
  });

  it("refresh(): sets user to null and skips the network entirely when no token is stored", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-out"),
    );
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("refresh(): clears the token and signs out when /auth/me rejects (expired/invalid token)", async () => {
    window.localStorage.setItem(TOKEN_KEY, "stale-token");
    mockApiRequest.mockRejectedValue(new Error("401"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-out"),
    );
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("login(): persists the token and resolves the session", async () => {
    mockApiRequest.mockImplementation(async (path: string) => {
      if (path === "/auth/me") return { userId: "user-1", username: "alice" };
      return PROFILE;
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-out"),
    );

    fireEvent.click(screen.getByText("login"));

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-in:alice"),
    );
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe("new-token");
  });

  it("logout(): clears the token and signs the user out", async () => {
    window.localStorage.setItem(TOKEN_KEY, "token-a");
    mockApiRequest.mockImplementation(async (path: string) => {
      if (path === "/auth/me") return { userId: "user-1", username: "alice" };
      return PROFILE;
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed-in:alice"),
    );

    fireEvent.click(screen.getByText("logout"));

    expect(screen.getByTestId("state")).toHaveTextContent("signed-out");
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
