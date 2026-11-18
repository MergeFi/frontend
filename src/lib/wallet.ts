import {
  isConnected as freighterIsConnected,
  isAllowed,
  setAllowed,
  getAddress,
  getNetwork,
  signTransaction as freighterSignTransaction,
  signMessage as freighterSignMessage,
} from "@stellar/freighter-api";
import { STELLAR_NETWORK } from "./config";
import type { StellarNetwork } from "./env";

export interface WalletConnection {
  address: string;
  /** Passphrase the extension is actually on, or null when it can't be read. */
  networkPassphrase: string | null;
}

/**
 * Single source of truth for network passphrases (#357). Keyed by
 * `StellarNetwork`, so adding a network to that type without a passphrase
 * here is a compile error.
 */
export const NETWORK_PASSPHRASES: Record<StellarNetwork, string> = {
  PUBLIC: "Public Global Stellar Network ; September 2015",
  TESTNET: "Test SDF Network ; September 2015",
};

/**
 * Read the network passphrase the Freighter extension is currently set to.
 * Returns null if the extension doesn't support getNetwork or isn't
 * reachable — callers should treat null as "unknown, proceed with caution."
 */
export async function getFreighterNetworkPassphrase(): Promise<string | null> {
  try {
    const result = await getNetwork();
    if (result.error || !result.networkPassphrase) return null;
    return result.networkPassphrase;
  } catch {
    return null;
  }
}

/**
 * Check whether Freighter's active network matches the app's configured
 * network. Returns a human-readable mismatch message if they differ, or
 * null if they match (or the check couldn't be performed).
 */
export async function checkNetworkMismatch(): Promise<string | null> {
  const freighterPassphrase = await getFreighterNetworkPassphrase();
  if (!freighterPassphrase) return null;
  const expected = NETWORK_PASSPHRASES[STELLAR_NETWORK];
  if (!expected) return null;
  if (freighterPassphrase === expected) return null;
  return `Your Freighter wallet is on the wrong network. Switch it to ${STELLAR_NETWORK === "PUBLIC" ? "Mainnet" : "Testnet"} and try again.`;
}

/**
 * What `@stellar/freighter-api`'s `isConnected` can actually tell us (#938):
 * - `available`: the extension answered and is reachable from this page.
 * - `not_detected`: it answered "not connected" — no extension, or one that
 *   hasn't injected into this page yet / is locked; the API can't separate
 *   those, so the message must not claim it's definitely not installed.
 * - `unreachable`: the call errored or threw — the extension is present but
 *   didn't respond.
 */
export type FreighterAvailability = "available" | "not_detected" | "unreachable";

export async function getFreighterAvailability(): Promise<FreighterAvailability> {
  try {
    const result = await freighterIsConnected();
    if (result.error) return "unreachable";
    return result.isConnected ? "available" : "not_detected";
  } catch {
    return "unreachable";
  }
}

/** Whether Freighter is present *and* reachable from this page right now. */
export async function isFreighterAvailable(): Promise<boolean> {
  return (await getFreighterAvailability()) === "available";
}

const FREIGHTER_UNAVAILABLE_MESSAGES: Record<Exclude<FreighterAvailability, "available">, string> = {
  not_detected:
    "Freighter wasn't detected. Install the Freighter wallet extension, or if it's already installed, unlock it and reload the page.",
  unreachable: "Freighter didn't respond. Unlock the extension and try again.",
};

/**
 * Passively read the currently-active Freighter address without prompting
 * the user for permission. Returns null if Freighter is not installed,
 * not connected, or not allowed — this is a read-only check, not a connect
 * action. Used by WalletContext to reconcile a cached localStorage address
 * against the extension's actual active account (#71).
 */
export async function getActiveFreighterAddress(): Promise<string | null> {
  try {
    if (!(await isFreighterAvailable())) return null;
    const allowed = await isAllowed();
    if (!allowed.isAllowed) return null;
    const { address, error } = await getAddress();
    if (error || !address) return null;
    return address;
  } catch {
    return null;
  }
}

export async function connectWallet(): Promise<WalletConnection> {
  const availability = await getFreighterAvailability();
  if (availability !== "available") {
    throw new Error(FREIGHTER_UNAVAILABLE_MESSAGES[availability]);
  }
  // Check the network *before* asking for access (#937): getNetwork needs no
  // permission, and a user on the wrong network should be told to switch
  // before being shown a permission prompt that would then be rejected.
  const earlyMismatch = await checkNetworkMismatch();
  if (earlyMismatch) {
    throw new Error(earlyMismatch);
  }
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
  // Re-check after access is granted: the user can switch network in the
  // extension while the permission prompt is open. A mismatch means any
  // signed transaction will be rejected by Soroban, but only after the user
  // has already approved it in the extension (#2).
  const mismatchMsg = await checkNetworkMismatch();
  if (mismatchMsg) {
    throw new Error(mismatchMsg);
  }
  return { address, networkPassphrase: await getFreighterNetworkPassphrase() };
}

export async function signTransaction(xdr: string, address: string) {
  return freighterSignTransaction(xdr, {
    address,
    // Reuse the shared mapping so signing and checkNetworkMismatch can't drift (#357).
    networkPassphrase: NETWORK_PASSPHRASES[STELLAR_NETWORK],
  });
}

/**
 * Sign a server-issued ownership challenge with Freighter (#32).
 *
 * This is message signing, not transaction signing: nothing is submitted to
 * the network and no funds can move. Replay protection comes from the nonce
 * and domain the backend embeds in `message`, which the caller must not
 * construct itself.
 *
 * Resolves to the signature as base64. Throws if the user rejects the
 * request or the signer isn't the address being proven.
 */
export async function signOwnershipMessage(
  message: string,
  address: string,
): Promise<string> {
  const result = await freighterSignMessage(message, {
    address,
    networkPassphrase: NETWORK_PASSPHRASES[STELLAR_NETWORK],
  });
  if (result.error || !result.signedMessage) {
    throw new Error(
      result.error?.message ?? "Wallet did not sign the ownership message.",
    );
  }
  if (result.signerAddress && result.signerAddress !== address) {
    throw new Error("The signing wallet doesn't match the address being linked.");
  }
  const signed = result.signedMessage;
  if (typeof signed === "string") return signed;
  let binary = "";
  for (const byte of signed as Uint8Array) binary += String.fromCharCode(byte);
  return btoa(binary);
}
