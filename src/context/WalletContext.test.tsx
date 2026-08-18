import { render, screen, waitFor, act } from "@testing-library/react";
import { WalletProvider, useWallet } from "./WalletContext";

const WALLET_KEY = "mergefi_wallet_address";

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null, refresh: jest.fn() }),
}));

jest.mock("@/lib/wallet", () => ({
  connectWallet: jest.fn(),
}));

// WalletContext imports apiRequest for profile linking on connect(), which
// pulls in src/lib/config.ts's env validation at module-load time — not
// exercised by these cross-tab tests, so it's mocked out like @/lib/wallet.
jest.mock("@/lib/api", () => ({
  apiRequest: jest.fn(),
}));

function TestConsumer() {
  const { address } = useWallet();
  return <div data-testid="address">{address ?? "disconnected"}</div>;
}

function dispatchWalletStorageEvent(newValue: string | null) {
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: WALLET_KEY,
      newValue,
      storageArea: window.localStorage,
    }),
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("WalletContext — cross-tab sync (issue #84)", () => {
  it("adopts an address connected in another tab", async () => {
    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("disconnected"),
    );

    act(() => {
      dispatchWalletStorageEvent("GABC123FROMANOTHERTAB");
    });

    expect(screen.getByTestId("address")).toHaveTextContent("GABC123FROMANOTHERTAB");
  });

  it("clears the address when disconnected in another tab", async () => {
    window.localStorage.setItem(WALLET_KEY, "GABC123ALREADYCONNECTED");

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("GABC123ALREADYCONNECTED"),
    );

    act(() => {
      dispatchWalletStorageEvent(null);
    });

    expect(screen.getByTestId("address")).toHaveTextContent("disconnected");
  });

  it("ignores storage events for unrelated keys", async () => {
    window.localStorage.setItem(WALLET_KEY, "GABC123ALREADYCONNECTED");

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("GABC123ALREADYCONNECTED"),
    );

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "mergefi_token",
          newValue: null,
          storageArea: window.localStorage,
        }),
      );
    });

    expect(screen.getByTestId("address")).toHaveTextContent("GABC123ALREADYCONNECTED");
  });
});
