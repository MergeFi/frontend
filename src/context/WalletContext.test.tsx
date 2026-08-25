import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { WalletProvider, useWallet } from "./WalletContext";
import { useAuth } from "@/context/AuthContext";
import { connectWallet } from "@/lib/wallet";
import { apiRequest } from "@/lib/api";

const WALLET_KEY = "mergefi_wallet_address";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
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

const mockUseAuth = useAuth as jest.Mock;
const mockConnectWallet = connectWallet as jest.Mock;
const mockApiRequest = apiRequest as jest.Mock;
const mockRefresh = jest.fn();

function TestConsumer() {
  const { address, connecting, error, connect, disconnect } = useWallet();
  return (
    <div>
      <div data-testid="address">{address ?? "disconnected"}</div>
      <div data-testid="connecting">{String(connecting)}</div>
      <div data-testid="error">{error ?? "none"}</div>
      <button onClick={() => void connect()}>connect</button>
      <button onClick={disconnect}>disconnect</button>
    </div>
  );
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
  mockUseAuth.mockReturnValue({ user: null, refresh: mockRefresh });
  mockConnectWallet.mockReset();
  mockApiRequest.mockReset();
  mockRefresh.mockReset();
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

describe("WalletContext — connect() (#231)", () => {
  it("sets address/network and returns the address on a successful connection", async () => {
    mockConnectWallet.mockResolvedValue({ address: "GNEWADDRESS", network: "TESTNET" });

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByText("connect"));

    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("GNEWADDRESS"),
    );
    expect(screen.getByTestId("connecting")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("none");
    expect(window.localStorage.getItem(WALLET_KEY)).toBe("GNEWADDRESS");
  });

  it("sets error and leaves address null when connectWallet() rejects", async () => {
    mockConnectWallet.mockRejectedValue(new Error("Install the Freighter wallet extension to continue."));

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByText("connect"));

    await waitFor(() =>
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Install the Freighter wallet extension to continue.",
      ),
    );
    expect(screen.getByTestId("address")).toHaveTextContent("disconnected");
    expect(screen.getByTestId("connecting")).toHaveTextContent("false");
  });

  it("sets a distinct error when the wallet connects but the profile-link PATCH fails (#229)", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, refresh: mockRefresh });
    mockConnectWallet.mockResolvedValue({ address: "GNEWADDRESS", network: "TESTNET" });
    mockApiRequest.mockRejectedValue(new Error("network error"));

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByText("connect"));

    // The wallet itself still connects successfully...
    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("GNEWADDRESS"),
    );
    // ...but the profile-link failure is surfaced, not swallowed.
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Wallet connected, but couldn't save it to your profile — try reconnecting.",
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("links the profile and refreshes the session when connected and signed in", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, refresh: mockRefresh });
    mockConnectWallet.mockResolvedValue({ address: "GNEWADDRESS", network: "TESTNET" });
    mockApiRequest.mockResolvedValue(undefined);

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByText("connect"));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/users/user-1/stellar-address",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(screen.getByTestId("error")).toHaveTextContent("none");
  });
});

describe("WalletContext — disconnect() (#230, #231)", () => {
  it("clears local address/network state and localStorage", async () => {
    mockConnectWallet.mockResolvedValue({ address: "GNEWADDRESS", network: "TESTNET" });

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByText("connect"));
    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("GNEWADDRESS"),
    );

    fireEvent.click(screen.getByText("disconnect"));

    expect(screen.getByTestId("address")).toHaveTextContent("disconnected");
    expect(window.localStorage.getItem(WALLET_KEY)).toBeNull();
  });

  it("does not call the backend when disconnecting while signed out", async () => {
    mockConnectWallet.mockResolvedValue({ address: "GNEWADDRESS", network: "TESTNET" });

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByText("connect"));
    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("GNEWADDRESS"),
    );

    fireEvent.click(screen.getByText("disconnect"));

    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("unlinks stellarAddress on the backend when disconnecting while signed in (#230)", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, refresh: mockRefresh });
    mockConnectWallet.mockResolvedValue({ address: "GNEWADDRESS", network: "TESTNET" });
    mockApiRequest.mockResolvedValue(undefined);

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByText("connect"));
    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("GNEWADDRESS"),
    );
    mockApiRequest.mockClear();

    fireEvent.click(screen.getByText("disconnect"));

    // Local state clears synchronously regardless of the backend call...
    expect(screen.getByTestId("address")).toHaveTextContent("disconnected");
    // ...and the unlink PATCH is fired.
    await waitFor(() =>
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/users/user-1/stellar-address",
        expect.objectContaining({ method: "PATCH", body: JSON.stringify({ stellarAddress: null }) }),
      ),
    );
  });

  it("still clears local state even when the backend unlink call fails", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, refresh: mockRefresh });
    mockConnectWallet.mockResolvedValue({ address: "GNEWADDRESS", network: "TESTNET" });

    render(
      <WalletProvider>
        <TestConsumer />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByText("connect"));
    await waitFor(() =>
      expect(screen.getByTestId("address")).toHaveTextContent("GNEWADDRESS"),
    );
    mockApiRequest.mockRejectedValue(new Error("network error"));

    fireEvent.click(screen.getByText("disconnect"));

    expect(screen.getByTestId("address")).toHaveTextContent("disconnected");
    expect(window.localStorage.getItem(WALLET_KEY)).toBeNull();
  });
});
