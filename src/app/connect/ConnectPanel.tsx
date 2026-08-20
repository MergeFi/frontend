"use client";

import { Code2, Wallet as WalletIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GITHUB_OAUTH_URL } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

export function ConnectPanel() {
  const { user } = useAuth();
  const { address, network, connecting, error, connect, mismatch } = useWallet();

  // Wallet is only considered "linked" when both connected in Freighter AND
  // persisted on the authenticated user's backend profile. A local-only
  // connection (address present but no user, or user without stellarAddress)
  // is a distinct partial state that must not be presented as complete.
  const isWalletLinked = Boolean(address && user?.stellarAddress);
  const isWalletLocalOnly = Boolean(address && user && !user.stellarAddress);

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

      {/* GitHub card */}
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
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
            <CheckCircle2 className="h-4 w-4" />
            Signed in as @{user.username}
          </div>
        ) : (
          <a href={GITHUB_OAUTH_URL} className="mt-4 block">
            <Button className="w-full">Continue with GitHub</Button>
          </a>
        )}
      </div>

      {/* Stellar wallet card */}
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

        {/* State matrix rendering */}
        {!user && !address && (
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:ring-slate-700">
            Sign in with GitHub first to link a wallet to your account.
          </div>
        )}

        {!user && address && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Wallet connected locally ({address.slice(0, 4)}...{address.slice(-4)}) but not linked to any account.
              Sign in with GitHub above to associate this wallet with your profile.
            </span>
          </div>
        )}

        {user && isWalletLinked && !mismatch && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
            <CheckCircle2 className="h-4 w-4" />
            Connected &amp; linked: {address!.slice(0, 4)}...{address!.slice(-4)} ({network})
          </div>
        )}

        {user && isWalletLocalOnly && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Wallet connected ({address!.slice(0, 4)}...{address!.slice(-4)}) but not yet linked to your profile.
              Click below to save this address to your account.
            </span>
          </div>
        )}

        {user && address && mismatch && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Your Freighter extension is now on a different account than the one linked here.
              Disconnect and reconnect to update.
            </span>
          </div>
        )}

        {/* Action buttons based on state */}
        {!address && user && (
          <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={connect}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Freighter"}
          </Button>
        )}

        {user && isWalletLocalOnly && (
          <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={connect}
            disabled={connecting}
          >
            {connecting ? "Linking..." : "Link this wallet to my account"}
          </Button>
        )}

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
