"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { connectWallet as freighterConnect } from "@/lib/wallet";
import { apiRequest } from "@/lib/api";
import { STELLAR_NETWORK } from "@/lib/config";
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
  /**
   * Synchronously reads the error connect() most recently set, bypassing
   * React's render/commit timing. A caller that awaits connect() and gets
   * null back can't rely on the `error` field above for the reason why —
   * that's a value from whatever render created the closure, not
   * necessarily updated yet by the time the awaited call resolves. This
   * reads a ref updated in lockstep with every setError() call, so it's
   * always current the instant connect()'s promise settles (#235).
   */
  getError: () => string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<string | null>(null);
  const updateError = useCallback((message: string | null) => {
    errorRef.current = message;
    setError(message);
  }, []);
  const getError = useCallback(() => errorRef.current, []);

  useEffect(() => {
    // localStorage is unavailable during SSR, so this can't be a lazy
    // useState initializer — it must run after mount on the client.
    // Deferred by a tick (#223), same as AuthProvider's mount hydration,
    // so this provider (mounted on every route) doesn't add to the
    // critical path to interactivity for routes that don't need it yet.
    const id = window.setTimeout(() => {
      const stored = window.localStorage.getItem(WALLET_KEY);
      if (stored) {
        setAddress(stored);
        // This app only ever signs against the build's configured network,
        // so a restored address always comes with that network (#228) —
        // no need to persist a separate network key.
        setNetwork(STELLAR_NETWORK);
      }
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
    updateError(null);
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
          // The wallet is still usable for signing this session even if the
          // backend write failed, but the user needs to know their payout
          // wallet wasn't actually saved to their profile (#229).
          updateError(
            "Wallet connected, but couldn't save it to your profile — try reconnecting.",
          );
        }
      }
      return connection.address;
    } catch (err) {
      // connectWallet() (lib/wallet.ts) already throws a real Error with a
      // specific, actionable message for every failure path it detects —
      // including "not installed" via isFreighterInstalled() — so there's
      // no distinct "not an Error" case that means "extension missing" to
      // special-case here (#192). The non-Error fallback below only covers
      // a genuinely unexpected non-Error throw.
      updateError(
        err instanceof Error ? err.message : "Unable to connect wallet. Please try again.",
      );
      return null;
    } finally {
      setConnecting(false);
    }
  }, [user, refresh, updateError]);

  const disconnect = useCallback(() => {
    window.localStorage.removeItem(WALLET_KEY);
    setAddress(null);
    setNetwork(null);
    if (user) {
      // Best-effort unlink, mirroring connect()'s PATCH — the local
      // disconnect (clearing UI/localStorage state) already succeeded
      // synchronously above regardless of whether this call does, so a
      // signed-in user's "disconnected" UI never lies about local state.
      // If this fails, AuthUser.stellarAddress on the backend still holds
      // the old address until the user connects again (#230).
      apiRequest(`/users/${user.id}/stellar-address`, {
        method: "PATCH",
        body: JSON.stringify({ stellarAddress: null }),
      }).catch(() => {});
    }
  }, [user]);

  return (
    <WalletContext.Provider
      value={{ address, network, connecting, error, connect, disconnect, getError }}
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
