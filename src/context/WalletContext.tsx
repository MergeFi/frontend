"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { connectWallet as freighterConnect, getActiveFreighterAddress } from "@/lib/wallet";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCrossTabStorage } from "@/hooks/useCrossTabStorage";

const WALLET_KEY = "mergefi_wallet_address";

interface WalletContextValue {
  address: string | null;
  network: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  mismatch: boolean;
  reconcile: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  const reconcile = useCallback(async () => {
    const stored = window.localStorage.getItem(WALLET_KEY);
    if (!stored) {
      setMismatch(false);
      return false;
    }
    const active = await getActiveFreighterAddress();
    if (active && active !== stored) {
      setMismatch(true);
      return true;
    } else {
      setMismatch(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(WALLET_KEY);
    if (stored) setAddress(stored);
    reconcile();
  }, [reconcile]);

  const handleWalletKeyChangedElsewhere = useCallback((newValue: string | null) => {
    setAddress(newValue);
    if (newValue === null) {
      // Disconnected in another tab — no address means no network either.
      setNetwork(null);
    }
  }, []);
  useCrossTabStorage(WALLET_KEY, handleWalletKeyChangedElsewhere);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      const connection = await freighterConnect();
      setAddress(connection.address);
      setNetwork(connection.network);
      window.localStorage.setItem(WALLET_KEY, connection.address);
      setMismatch(false);

      if (user) {
        try {
          await apiRequest(`/users/${user.id}/stellar-address`, {
            method: "PATCH",
            body: JSON.stringify({ stellarAddress: connection.address }),
          });
          await refresh();
        } catch {
          // Linking to the profile is best-effort; the wallet is still usable
          // for signing this session even if the backend write failed.
        }
      }
      return connection.address;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Install the Freighter wallet extension to continue.",
      );
      return null;
    } finally {
      setConnecting(false);
    }
  }, [user, refresh]);

  const disconnect = useCallback(() => {
    window.localStorage.removeItem(WALLET_KEY);
    setAddress(null);
    setNetwork(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, network, connecting, error, connect, disconnect, mismatch, reconcile }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
