import { renderHook, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { ApiRequestError } from "@/lib/api";
import { useWalletAction } from "./useWalletAction";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/context/WalletContext", () => ({
  useWallet: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;
const mockUseWallet = useWallet as jest.Mock;

describe("useWalletAction", () => {
  const mockRefresh = jest.fn();
  const mockConnect = jest.fn();
  const mockGetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ refresh: mockRefresh });
    mockUseWallet.mockReturnValue({
      address: "GBTESTWALLETADDRESS12345",
      connect: mockConnect,
      connecting: false,
      addressMismatch: false,
      networkMismatch: false,
      getError: mockGetError,
    });
  });

  it("blocks and sets error when addressMismatch is true", async () => {
    mockUseWallet.mockReturnValue({
      address: "GBTESTWALLETADDRESS12345",
      connect: mockConnect,
      connecting: false,
      addressMismatch: true,
      networkMismatch: false,
      getError: mockGetError,
    });

    const { result } = renderHook(() => useWalletAction());
    const action = jest.fn();

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.execute(action);
    });

    expect(success).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(result.current.error).toContain(
      "Freighter's active account has changed. Please disconnect and reconnect your wallet to continue."
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("blocks and sets error when networkMismatch is true", async () => {
    mockUseWallet.mockReturnValue({
      address: "GBTESTWALLETADDRESS12345",
      connect: mockConnect,
      connecting: false,
      addressMismatch: false,
      networkMismatch: true,
      getError: mockGetError,
    });

    const { result } = renderHook(() => useWalletAction());
    const action = jest.fn();

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.execute(action);
    });

    expect(success).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(result.current.error).toContain(
      "Your Freighter wallet is on the wrong network. Switch it in the extension and try again."
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("calls connect() if address is null, and uses getError() fallback if connect returns null", async () => {
    mockConnect.mockResolvedValue(null);
    mockGetError.mockReturnValue("User rejected wallet connection");

    mockUseWallet.mockReturnValue({
      address: null,
      connect: mockConnect,
      connecting: false,
      addressMismatch: false,
      networkMismatch: false,
      getError: mockGetError,
    });

    const { result } = renderHook(() => useWalletAction());
    const action = jest.fn();

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.execute(action);
    });

    expect(success).toBe(false);
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();
    expect(result.current.error).toBe("User rejected wallet connection");
  });

  it("uses defaultConnectError option when getError() returns null", async () => {
    mockConnect.mockResolvedValue(null);
    mockGetError.mockReturnValue(null);

    mockUseWallet.mockReturnValue({
      address: null,
      connect: mockConnect,
      connecting: false,
      addressMismatch: false,
      networkMismatch: false,
      getError: mockGetError,
    });

    const { result } = renderHook(() =>
      useWalletAction({ defaultConnectError: "Custom connect error" })
    );
    const action = jest.fn();

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.execute(action);
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Custom connect error");
  });

  it("executes action with connected address, refreshes router, and calls callbacks", async () => {
    const onStart = jest.fn();
    const onSuccess = jest.fn();

    const { result } = renderHook(() =>
      useWalletAction({ onStart, onSuccess })
    );

    const action = jest.fn().mockResolvedValue(undefined);

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.execute(action);
    });

    expect(success).toBe(true);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith("GBTESTWALLETADDRESS12345");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it("catches ApiRequestError and formats message", async () => {
    const { result } = renderHook(() => useWalletAction());

    const action = jest.fn().mockRejectedValue(new ApiRequestError("Bad request to API", 400));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.execute(action);
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Bad request to API");
  });

  it("catches unexpected exceptions and displays fallback message", async () => {
    const { result } = renderHook(() => useWalletAction());

    const action = jest.fn().mockRejectedValue(new Error("Network disconnect"));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.execute(action);
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Something went wrong.");
  });
});
