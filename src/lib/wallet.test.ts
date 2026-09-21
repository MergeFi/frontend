import {
  NETWORK_PASSPHRASES,
  signTransaction,
  checkNetworkMismatch,
  isFreighterInstalled,
} from "./wallet";
import { STELLAR_NETWORK } from "./config";
import {
  signTransaction as freighterSignTransaction,
  getNetwork,
  isConnected as freighterIsConnected,
} from "@stellar/freighter-api";

jest.mock("@stellar/freighter-api", () => ({
  isConnected: jest.fn(),
  isAllowed: jest.fn(),
  setAllowed: jest.fn(),
  getAddress: jest.fn(),
  getNetwork: jest.fn(),
  signTransaction: jest.fn(),
}));

describe("wallet lib", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("NETWORK_PASSPHRASES constant", () => {
    it("defines canonical passphrases for PUBLIC and TESTNET", () => {
      expect(NETWORK_PASSPHRASES.PUBLIC).toBe(
        "Public Global Stellar Network ; September 2015"
      );
      expect(NETWORK_PASSPHRASES.TESTNET).toBe(
        "Test SDF Network ; September 2015"
      );
    });
  });

  describe("signTransaction", () => {
    it("delegates to freighterSignTransaction using the passphrase from NETWORK_PASSPHRASES", async () => {
      const mockResult = { signedXDR: "AAAA...signed", error: undefined };
      (freighterSignTransaction as jest.Mock).mockResolvedValue(mockResult);

      const xdr = "AAAA...unsigned";
      const address = "GBBDU6VU2FS277747H5RTV7WGHQ22W6V6OQC2M5VOHJ7G2U43G3XN3Z6";

      const res = await signTransaction(xdr, address);

      expect(freighterSignTransaction).toHaveBeenCalledTimes(1);
      expect(freighterSignTransaction).toHaveBeenCalledWith(xdr, {
        address,
        networkPassphrase: NETWORK_PASSPHRASES[STELLAR_NETWORK],
      });
      expect(res).toBe(mockResult);
    });
  });

  describe("checkNetworkMismatch", () => {
    it("returns null when Freighter network matches expected passphrase", async () => {
      (getNetwork as jest.Mock).mockResolvedValue({
        network: NETWORK_PASSPHRASES[STELLAR_NETWORK],
      });

      const mismatch = await checkNetworkMismatch();
      expect(mismatch).toBeNull();
    });

    it("returns an error message when Freighter network differs from expected", async () => {
      (getNetwork as jest.Mock).mockResolvedValue({
        network: "Wrong Network Passphrase",
      });

      const mismatch = await checkNetworkMismatch();
      expect(mismatch).toContain("Your Freighter wallet is on the wrong network");
    });

    it("returns null if getNetwork returns null or error", async () => {
      (getNetwork as jest.Mock).mockResolvedValue({ error: "Unavailable" });
      const mismatch = await checkNetworkMismatch();
      expect(mismatch).toBeNull();
    });
  });

  describe("isFreighterInstalled", () => {
    it("returns true when freighter is connected", async () => {
      (freighterIsConnected as jest.Mock).mockResolvedValue({
        isConnected: true,
      });
      expect(await isFreighterInstalled()).toBe(true);
    });

    it("returns false when freighter is not connected", async () => {
      (freighterIsConnected as jest.Mock).mockResolvedValue({
        isConnected: false,
      });
      expect(await isFreighterInstalled()).toBe(false);
    });
  });
});
