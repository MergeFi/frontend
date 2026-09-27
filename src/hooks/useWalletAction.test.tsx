import { act, renderHook } from "@testing-library/react";
import { useWallet } from "@/context/WalletContext";
import { useWalletAction } from "./useWalletAction";

jest.mock("@/context/WalletContext", () => ({
  useWallet: jest.fn(),
}));

const mockUseWallet = useWallet as jest.Mock;

function setWallet(overrides: Partial<ReturnType<typeof useWallet>> = {}) {
  mockUseWallet.mockReturnValue({
    address: null,
    connecting: false,
    addressMismatch: false,
    networkMismatch: false,
    connect: jest.fn(),
    getError: jest.fn(),
    refreshNetworkState: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  mockUseWallet.mockReset();
});

describe("useWalletAction", () => {
  it.each([
    ["addressMismatch", "Freighter's active account has changed."],
    ["networkMismatch", "Your Freighter wallet is on the wrong network."],
  ] as const)("blocks signing when %s is set", async (mismatch, message) => {
    const connect = jest.fn();
    setWallet({ [mismatch]: true, connect } as Partial<ReturnType<typeof useWallet>>);
    const action = jest.fn();
    const { result } = renderHook(() => useWalletAction());

    let response: Awaited<ReturnType<typeof result.current.runWithWallet>>;
    await act(async () => {
      response = await result.current.runWithWallet(action, "Fallback message.");
    });

    expect(response!).toEqual({ ok: false, error: expect.stringContaining(message) });
    expect(connect).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });

  it("returns the fresh connection error when connect resolves without an address", async () => {
    const getError = jest.fn(() => "Wallet access was not granted.");
    setWallet({ connect: jest.fn().mockResolvedValue(null), getError });
    const { result } = renderHook(() => useWalletAction());
    let response: Awaited<ReturnType<typeof result.current.runWithWallet>>;

    await act(async () => {
      response = await result.current.runWithWallet(jest.fn(), "Fallback message.");
    });

    expect(response!).toEqual({ ok: false, error: "Wallet access was not granted." });
    expect(getError).toHaveBeenCalledTimes(1);
  });

  it("runs the action with the connected wallet address", async () => {
    setWallet({ connect: jest.fn().mockResolvedValue("GCONNECTED") });
    const action = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useWalletAction());

    await act(async () => {
      await expect(
        result.current.runWithWallet(action, "Fallback message."),
      ).resolves.toEqual({ ok: true });
    });

    expect(action).toHaveBeenCalledWith("GCONNECTED");
  });

  it("recovers from a stale networkMismatch when a cached address exists (#349)", async () => {
    // The user's extension network was wrong at mount (flag latched true),
    // but they corrected it — refreshNetworkState() now reports no mismatch.
    const connect = jest.fn();
    const refreshNetworkState = jest.fn().mockResolvedValue(false);
    setWallet({
      address: "GCACHED",
      networkMismatch: true,
      connect,
      refreshNetworkState,
    });
    const action = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useWalletAction());

    let response: Awaited<ReturnType<typeof result.current.runWithWallet>>;
    await act(async () => {
      response = await result.current.runWithWallet(action, "Fallback message.");
    });

    expect(response!).toEqual({ ok: true });
    expect(refreshNetworkState).toHaveBeenCalledTimes(1);
    expect(connect).not.toHaveBeenCalled();
    // Action runs with the cached address, not a freshly connected one.
    expect(action).toHaveBeenCalledWith("GCACHED");
  });

  it("still blocks when the network is genuinely mismatched after re-derivation (#349)", async () => {
    const connect = jest.fn();
    const refreshNetworkState = jest.fn().mockResolvedValue(true);
    setWallet({
      address: "GCACHED",
      networkMismatch: true,
      connect,
      refreshNetworkState,
    });
    const action = jest.fn();
    const { result } = renderHook(() => useWalletAction());

    let response: Awaited<ReturnType<typeof result.current.runWithWallet>>;
    await act(async () => {
      response = await result.current.runWithWallet(action, "Fallback message.");
    });

    expect(response!).toEqual({
      ok: false,
      error: "Your Freighter wallet is on the wrong network. Switch it in the extension and try again.",
    });
    expect(refreshNetworkState).toHaveBeenCalledTimes(1);
    expect(connect).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });
});