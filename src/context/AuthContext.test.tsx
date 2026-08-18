import { render, screen, waitFor, act } from "@testing-library/react";
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
  const { user, loading } = useAuth();
  if (loading) return <div data-testid="state">loading</div>;
  return <div data-testid="state">{user ? `signed-in:${user.username}` : "signed-out"}</div>;
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
