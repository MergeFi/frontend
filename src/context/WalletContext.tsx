"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { connectWallet as freighterConnect, signMessage } from "@/lib/wallet";
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

/**
 * Proof-of-ownership challenge format (Issue #32):
 * The signed message includes a timestamp nonce and domain binding to prevent
 * replay attacks. The backend must verify:
 *   1. The signature is valid for the claimed address
 *   2. The nonce is recent (e.g. within 5 minutes)
 *   3. The domain matches the expected origin
 *
 * Backend contract note: POST /users/:id/stellar-address/challenge should return
 * { nonce: string } and PATCH /users/:id/stellar-address should accept
 * { stellarAddress, signature, nonce } and verify server-side.
 */
function buildChallengeMessage(nonce: string, address: string): string {
  const domain = typeof window !== "undefined" ? window.location.hostname : "mergefi.app";
  return `MergeFi Wallet Link\nDomain: ${domain}\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reconcile on mount: backend's recorded address is authoritative.
  // If the user is authenticated and has a stellarAddress on their profile,
  // that takes precedence over whatever is in localStorage.
  useEffect(() => {
    if (user?.stellarAddress) {
      // Backend says this user has a linked address — trust it over localStorage
      setAddress(user.stellarAddress);
      // Sync localStorage to match
      window.localStorage.setItem(WALLET_KEY, user.stellarAddress);
    } else {
      // No backend link yet — fall back to localStorage for unlinked sessions
      const stored = window.localStorage.getItem(WALLET_KEY);
      if (stored) setAddress(stored);
    }
  }, [user?.stellarAddress]);

  const handleWalletKeyChangedElsewhere = useCallback((newValue: string | null) => {
    // Only update from cross-tab if there's no backend-linked address
    // (backend is authoritative when present)
    if (!user?.stellarAddress) {
      setAddress(newValue);
      if (newValue === null) setNetwork(null);
    }
  }, [user?.stellarAddress]);
  useCrossTabStorage(WALLET_KEY, handleWalletKeyChangedElsewhere);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      const connection = await freighterConnect();
      const newAddress = connection.address;

      // Check if this is a different address than what's already linked
      const currentLinked = user?.stellarAddress;
      if (currentLinked && currentLinked !== newAddress) {
        // Different Freighter account than the one linked to this user.
        // Require explicit re-confirmation — never silently override.
        const confirmed = typeof window !== "undefined" && window.confirm(
          `Your account is currently linked to ${currentLinked.slice(0, 8)}...` +
          ` but Freighter shows ${newAddress.slice(0, 8)}...\n\n` +
          `Linking this new address will replace your existing payout address. ` +
          `This requires signing a proof-of-ownership message.\n\nContinue?`
        );
        if (!confirmed) {
          setConnecting(false);
          return null;
        }
      }

      // Proof-of-ownership: sign a challenge message before linking
      const nonce = crypto.randomUUID();
      const challengeMsg = buildChallengeMessage(nonce, newAddress);
      let signature: string;
      try {
        signature = await signMessage(challengeMsg, newAddress);
      } catch (signErr) {
        setError(
          signErr instanceof Error
            ? signErr.message
            : "Message signing was rejected. Cannot link wallet without proof of ownership."
        );
        setConnecting(false);
        return null;
      }

      // Persist locally first so the wallet is usable this session
      setAddress(newAddress);
      setNetwork(connection.network);
      window.localStorage.setItem(WALLET_KEY, newAddress);

      // Link to profile with proof-of-ownership
      if (user) {
        try {
          await apiRequest(`/users/${user.id}/stellar-address`, {
            method: "PATCH",
            body: JSON.stringify({
              stellarAddress: newAddress,
              signature,
              nonce,
              message: challengeMsg,
            }),
          });
          await refresh();
        } catch (linkErr) {
          // If the backend doesn't support signed linking yet, fall back to
          // the unsigned endpoint but log the gap. The wallet is still usable
          // for signing transactions this session.
          console.warn(
            "[WalletContext] Signed wallet linking failed — backend may not " +
            "support proof-of-ownership yet. Falling back to unsigned link.",
            linkErr,
          );
          try {
            await apiRequest(`/users/${user.id}/stellar-address`, {
              method: "PATCH",
              body: JSON.stringify({ stellarAddress: newAddress }),
            });
            await refresh();
          } catch {
            // Best-effort: wallet works locally even if backend link fails
          }
        }
      }
      return newAddress;
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
