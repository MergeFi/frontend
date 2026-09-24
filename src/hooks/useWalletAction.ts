"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { ApiRequestError } from "@/lib/api";

export interface UseWalletActionOptions {
  /** Fallback message when connect fails and getWalletError() returns null. */
  defaultConnectError?: string;
  /** Optional callback fired before starting gating checks (e.g. to clear notices). */
  onStart?: () => void;
  /** Optional callback upon successful action completion. */
  onSuccess?: () => void;
}

export interface ExecuteOptions {
  defaultConnectError?: string;
  onSuccess?: () => void;
}

export function useWalletAction(options: UseWalletActionOptions = {}) {
  const router = useRouter();
  const {
    address,
    connect,
    connecting,
    addressMismatch,
    networkMismatch,
    getError: getWalletError,
  } = useWallet();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      action: (walletAddress: string) => Promise<void>,
      execOptions?: ExecuteOptions
    ): Promise<boolean> => {
      setError(null);
      options.onStart?.();

      // Block if Freighter's active account has drifted from the cached address.
      // The user must reconnect to re-sync before any signing action (#71).
      if (addressMismatch) {
        setError(
          "Freighter's active account has changed. Please disconnect and reconnect your wallet to continue."
        );
        return false;
      }

      // Block if Freighter's network doesn't match the app's configured network.
      // A signed transaction would be rejected by Soroban anyway, but this
      // avoids burning the user's attention on a doomed approval (#2).
      if (networkMismatch) {
        setError(
          "Your Freighter wallet is on the wrong network. Switch it in the extension and try again."
        );
        return false;
      }

      setPending(true);
      try {
        const walletAddress = address ?? (await connect());
        if (!walletAddress) {
          // connect() resolves to null on failure rather than throwing, but
          // WalletContext already computed a specific reason (extension not
          // installed, access denied, ...). getError() reads it synchronously
          // off a ref rather than the (possibly stale, pre-await) `error`
          // value from context, so it's guaranteed current here (#235).
          const fallback =
            execOptions?.defaultConnectError ??
            options.defaultConnectError ??
            "Connect a Stellar wallet to continue.";
          setError(getWalletError() ?? fallback);
          return false;
        }

        await action(walletAddress);
        router.refresh();
        execOptions?.onSuccess?.();
        options.onSuccess?.();
        return true;
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
        return false;
      } finally {
        setPending(false);
      }
    },
    [
      address,
      connect,
      addressMismatch,
      networkMismatch,
      getWalletError,
      router,
      options,
    ]
  );

  return {
    execute,
    pending,
    connecting,
    isLoading: pending || connecting,
    error,
    setError,
    clearError: useCallback(() => setError(null), []),
  };
}
