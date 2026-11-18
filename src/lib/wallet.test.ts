const mockSign = jest.fn();

jest.mock("@stellar/freighter-api", () => ({
  isConnected: jest.fn(),
  isAllowed: jest.fn(),
  setAllowed: jest.fn(),
  getAddress: jest.fn(),
  getNetwork: jest.fn(),
  signTransaction: (...args: unknown[]) => mockSign(...args),
}));

jest.mock("./config", () => ({ STELLAR_NETWORK: "PUBLIC" }));

import {
  isConnected,
  isAllowed,
  setAllowed,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api";
import {
  connectWallet,
  getFreighterAvailability,
  NETWORK_PASSPHRASES,
  signTransaction,
} from "./wallet";

describe("signTransaction", () => {
  beforeEach(() => mockSign.mockReset());

  it("signs with the shared passphrase for the configured network", async () => {
    mockSign.mockResolvedValue({ signedTxXdr: "signed" });
    await signTransaction("xdr", "GABC");
    expect(mockSign).toHaveBeenCalledWith("xdr", {
      address: "GABC",
      networkPassphrase: NETWORK_PASSPHRASES.PUBLIC,
    });
  });
});

describe("NETWORK_PASSPHRASES", () => {
  it("has the canonical Stellar passphrases", () => {
    expect(NETWORK_PASSPHRASES).toEqual({
      PUBLIC: "Public Global Stellar Network ; September 2015",
      TESTNET: "Test SDF Network ; September 2015",
    });
  });
});

const mockIsConnected = isConnected as jest.Mock;
const mockIsAllowed = isAllowed as jest.Mock;
const mockSetAllowed = setAllowed as jest.Mock;
const mockGetAddress = getAddress as jest.Mock;
const mockGetNetwork = getNetwork as jest.Mock;

describe("getFreighterAvailability (#938)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("is available when the extension answers connected", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    expect(await getFreighterAvailability()).toBe("available");
  });

  it("is not_detected when the extension answers not connected", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false });
    expect(await getFreighterAvailability()).toBe("not_detected");
  });

  it("is unreachable when the call errors or throws", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false, error: { message: "x" } });
    expect(await getFreighterAvailability()).toBe("unreachable");
    mockIsConnected.mockRejectedValue(new Error("boom"));
    expect(await getFreighterAvailability()).toBe("unreachable");
  });
});

describe("connectWallet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockIsAllowed.mockResolvedValue({ isAllowed: false });
    mockSetAllowed.mockResolvedValue({ isAllowed: true });
    mockGetAddress.mockResolvedValue({ address: "GABC" });
    mockGetNetwork.mockResolvedValue({ networkPassphrase: NETWORK_PASSPHRASES.PUBLIC });
  });

  // #937 — a wrong network must be reported before the permission prompt.
  it("rejects a wrong network without ever asking for access", async () => {
    mockGetNetwork.mockResolvedValue({ networkPassphrase: NETWORK_PASSPHRASES.TESTNET });

    await expect(connectWallet()).rejects.toThrow(/wrong network/);
    expect(mockSetAllowed).not.toHaveBeenCalled();
    expect(mockGetAddress).not.toHaveBeenCalled();
  });

  it("re-checks the network after access is granted", async () => {
    mockGetNetwork
      .mockResolvedValueOnce({ networkPassphrase: NETWORK_PASSPHRASES.PUBLIC })
      .mockResolvedValue({ networkPassphrase: NETWORK_PASSPHRASES.TESTNET });

    await expect(connectWallet()).rejects.toThrow(/wrong network/);
    expect(mockSetAllowed).toHaveBeenCalledTimes(1);
  });

  it("connects when the network matches", async () => {
    await expect(connectWallet()).resolves.toEqual({
      address: "GABC",
      networkPassphrase: NETWORK_PASSPHRASES.PUBLIC,
    });
  });

  // #938 — "not detected" and "didn't respond" get different, actionable messages.
  it("does not claim the extension is missing when it just didn't respond", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false, error: { message: "x" } });
    await expect(connectWallet()).rejects.toThrow(/didn't respond/);
  });

  it("tells a user with no detected extension to install or unlock it", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false });
    await expect(connectWallet()).rejects.toThrow(/wasn't detected.*unlock it and reload/);
  });
});
