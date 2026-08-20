"use client";

import { Code2, Wallet as WalletIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GITHUB_OAUTH_URL } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

export function ConnectPanel() {
  const { user } = useAuth();
  const { address, network, connecting, error, connect } = useWallet();

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Get started
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Connect your accounts
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          MergeFi needs GitHub to sync your repositories and a Stellar wallet
          to send or receive bounty payments.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <Code2 className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">GitHub</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sync repositories, issues, and pull requests.
            </p>
          </div>
        </div>
        {user ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            Signed in as @{user.username}
          </div>
        ) : (
          <a href={GITHUB_OAUTH_URL} className="mt-4 block">
            <Button className="w-full">Continue with GitHub</Button>
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
            <WalletIcon className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Stellar wallet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Freighter is used to sign escrow and payout transactions.
            </p>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          {address ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
              <CheckCircle2 className="h-4 w-4" />
              Connected: {address.slice(0, 4)}...{address.slice(-4)} ({network})
            </div>
          ) : (
            <Button
              className="w-full"
              variant="outline"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? "Connecting..." : "Connect Freighter"}
            </Button>
          )}

          {user ? (
            user.stellarAddress && user.stellarAddress === address ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
                <CheckCircle2 className="h-4 w-4" />
                Linked to your account
              </div>
            ) : address ? (
              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                This wallet is connected locally but not linked to your GitHub account.
                {user.stellarAddress ? ` Your account is currently linked to ${user.stellarAddress.slice(0, 4)}...${user.stellarAddress.slice(-4)}.` : ""}
              </div>
            ) : user.stellarAddress ? (
              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
                Your account is linked to {user.stellarAddress.slice(0, 4)}...{user.stellarAddress.slice(-4)}, but it is not currently active in Freighter.
              </div>
            ) : null
          ) : address ? (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
              Wallet connected locally. Sign in with GitHub above to link this wallet to your account for payouts.
            </div>
          ) : null}
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
