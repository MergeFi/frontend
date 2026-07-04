"use client";

import { useState } from "react";
import { Code2, Wallet as WalletIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GITHUB_OAUTH_URL } from "@/lib/config";
import { connectWallet, type WalletConnection } from "@/lib/wallet";

export function ConnectPanel() {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function handleConnectWallet() {
    setError(null);
    setConnecting(true);
    try {
      const connection = await connectWallet();
      setWallet(connection);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Install the Freighter wallet extension to continue.",
      );
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Connect your accounts
        </h1>
        <p className="mt-2 text-slate-400">
          MergeFi needs GitHub to sync your repositories and a Stellar wallet
          to send or receive bounty payments.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-slate-300" />
          <div>
            <p className="font-medium text-white">GitHub</p>
            <p className="text-sm text-slate-400">
              Sync repositories, issues, and pull requests.
            </p>
          </div>
        </div>
        <a href={GITHUB_OAUTH_URL} className="mt-4 block">
          <Button className="w-full">Continue with GitHub</Button>
        </a>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-3">
          <WalletIcon className="h-5 w-5 text-slate-300" />
          <div>
            <p className="font-medium text-white">Stellar wallet</p>
            <p className="text-sm text-slate-400">
              Freighter is used to sign escrow and payout transactions.
            </p>
          </div>
        </div>
        {wallet ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
            <CheckCircle2 className="h-4 w-4" />
            Connected: {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)} (
            {wallet.network})
          </div>
        ) : (
          <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={handleConnectWallet}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Freighter"}
          </Button>
        )}
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      </div>
    </div>
  );
}
