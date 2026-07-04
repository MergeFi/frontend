import {
  isConnected as freighterIsConnected,
  isAllowed,
  setAllowed,
  getAddress,
  signTransaction as freighterSignTransaction,
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
