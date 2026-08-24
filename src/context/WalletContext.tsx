"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { connectWallet as freighterConnect } from "@/lib/wallet";
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
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // localStorage is unavailable during SSR, so this can't be a lazy
    // useState initializer — it must run after mount on the client.
    // Deferred by a tick (#223), same as AuthProvider's mount hydration,
    // so this provider (mounted on every route) doesn't add to the
    // critical path to interactivity for routes that don't need it yet.
    const id = window.setTimeout(() => {
      const stored = window.localStorage.getItem(WALLET_KEY);
      if (stored) setAddress(stored);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

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
      value={{ address, network, connecting, error, connect, disconnect }}
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
