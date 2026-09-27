import { useWallet } from "@/context/WalletContext";

type WalletActionResult = { ok: true } | { ok: false; error: string };

const ADDRESS_MISMATCH_ERROR =
  "Freighter's active account has changed. Please disconnect and reconnect your wallet to continue.";
const NETWORK_MISMATCH_ERROR =
  "Your Freighter wallet is on the wrong network. Switch it in the extension and try again.";

export function useWalletAction() {
  const {
    address,
    connect,
    connecting,
    addressMismatch,
    networkMismatch,
    refreshNetworkState,
    getError,
  } = useWallet();

  async function runWithWallet(
    action: (walletAddress: string) => Promise<unknown>,
    connectError: string,
  ): Promise<WalletActionResult> {
    // A stale `networkMismatch` flag (a transient wrong network detected at
    // mount) must not permanently block on-chain actions once the user fixes
    // the network in their extension. Re-derive it from Freighter's *current*
    // live state — but only when we already have a cached address to act on, so
    // a genuine mismatch (or a missing wallet) still blocks as before (#349).
    if (address && networkMismatch) {
      const stillMismatched = await refreshNetworkState();
      if (stillMismatched) {
        return { ok: false, error: NETWORK_MISMATCH_ERROR };
      }
      // network re-check confirmed good; proceed with the cached address
      // (skip connect()'s backend profile PATCH — nothing changed).
      await action(address);
      return { ok: true };
    }

    if (addressMismatch) return { ok: false, error: ADDRESS_MISMATCH_ERROR };
    if (networkMismatch) return { ok: false, error: NETWORK_MISMATCH_ERROR };

    const walletAddress = address ?? (await connect());
    if (!walletAddress) {
      return { ok: false, error: getError() ?? connectError };
    }

    await action(walletAddress);
    return { ok: true };
  }

  return { runWithWallet, connecting };
}