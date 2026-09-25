import { useWallet } from "@/context/WalletContext";

type WalletActionResult = { ok: true } | { ok: false; error: string };

const ADDRESS_MISMATCH_ERROR =
  "Freighter's active account has changed. Please disconnect and reconnect your wallet to continue.";
const NETWORK_MISMATCH_ERROR =
  "Your Freighter wallet is on the wrong network. Switch it in the extension and try again.";

export function useWalletAction() {
  const { address, connect, connecting, addressMismatch, networkMismatch, getError } =
    useWallet();

  async function runWithWallet(
    action: (walletAddress: string) => Promise<unknown>,
    connectError: string,
  ): Promise<WalletActionResult> {
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