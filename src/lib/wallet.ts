import {
  isConnected as freighterIsConnected,
  isAllowed,
  setAllowed,
  getAddress,
  signTransaction as freighterSignTransaction,
  signMessage as freighterSignMessage,
} from "@stellar/freighter-api";
import { STELLAR_NETWORK } from "./config";

export interface WalletConnection {
  address: string;
  network: string;
}

export async function isFreighterInstalled(): Promise<boolean> {
  const result = await freighterIsConnected();
  return !result.error && result.isConnected;
}

export async function connectWallet(): Promise<WalletConnection> {
  const allowed = await isAllowed();
  if (!allowed.isAllowed) {
    const granted = await setAllowed();
    if (granted.error || !granted.isAllowed) {
      throw new Error("Wallet access was not granted.");
    }
  }
  const { address, error } = await getAddress();
  if (error || !address) {
    throw new Error(error?.message ?? "Unable to read wallet address.");
  }
  return { address, network: STELLAR_NETWORK };
}

export async function signTransaction(xdr: string, address: string) {
  return freighterSignTransaction(xdr, {
    address,
    networkPassphrase:
      STELLAR_NETWORK === "PUBLIC"
        ? "Public Global Stellar Network ; September 2015"
        : "Test SDF Network ; September 2015",
  });
}

/**
 * Sign an arbitrary message for proof-of-ownership (Issue #32).
 * The message MUST include a nonce and domain binding to prevent replay attacks.
 * Returns the base64-encoded signature.
 */
export async function signMessage(message: string, address: string): Promise<string> {
  const result = await freighterSignMessage(message, {
    address,
    networkPassphrase:
      STELLAR_NETWORK === "PUBLIC"
        ? "Public Global Stellar Network ; September 2015"
        : "Test SDF Network ; September 2015",
  });
  if (result.error || !result.signedMessage) {
    throw new Error(result.error?.message ?? "Message signing was rejected.");
  }
  return typeof result.signedMessage === "string" ? result.signedMessage : String(result.signedMessage);
}
