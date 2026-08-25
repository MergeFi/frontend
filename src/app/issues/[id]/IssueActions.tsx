"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { apiPost, ApiRequestError } from "@/lib/api";
import { formatCurrency, generateIdempotencyKey } from "@/lib/utils";
import type { Bounty } from "@/types";

export function IssueActions({ bounty }: { bounty: Bounty }) {
  const router = useRouter();
  const { user } = useAuth();
  const { address, connect, connecting, addressMismatch, getError: getWalletError } = useWallet();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function withWallet(action: (walletAddress: string) => Promise<void>) {
    setError(null);
    setNotice(null);

    // Block if Freighter's active account has drifted from the cached address.
    // The user must reconnect to re-sync before any signing action (#71).
    if (addressMismatch) {
      setError(
        "Freighter's active account has changed. Please disconnect and reconnect your wallet to continue.",
      );
      return;
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
        setError(getWalletError() ?? "Connect a Stellar wallet to continue.");
        return;
      }
      await action(walletAddress);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  async function handleFund() {
    await withWallet(async (walletAddress) => {
      await apiPost(`/bounties/${bounty.id}/fund`, {
        funderAddress: walletAddress,
        idempotencyKey: generateIdempotencyKey(),
      });
      setNotice("Escrow funded on-chain. This bounty is now open for claims.");
    });
  }

  async function handleClaim() {
    setError(null);
    setNotice(null);
    if (!user) {
      router.push("/connect");
      return;
    }
    setPending(true);
    try {
      await apiPost(`/bounties/${bounty.id}/claim`, {
        contributorId: user.id,
        idempotencyKey: generateIdempotencyKey(),
      });
      setNotice("You've claimed this issue. Open a pull request to get started.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  async function handleRefund() {
    const confirmed = window.confirm(
      `Are you sure you want to refund this bounty? This will return ${formatCurrency(bounty.reward, bounty.asset)} to the sponsor and cannot be undone.`,
    );
    if (!confirmed) return;

    setError(null);
    setNotice(null);
    setPending(true);
    try {
      await apiPost(`/bounties/${bounty.id}/refund`, {
        idempotencyKey: generateIdempotencyKey(),
      });
      setNotice("Escrowed funds were refunded to the sponsor.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-3">
        {bounty.status === "open" && (
          <Button size="lg" onClick={handleFund} loading={pending || connecting}>
            {pending || connecting ? "Confirming in wallet..." : "Fund this bounty"}
          </Button>
        )}
        {bounty.status === "funded" && (
          <Button size="lg" onClick={handleClaim} loading={pending}>
            {pending ? "Claiming..." : "Claim this issue"}
          </Button>
        )}
        {(bounty.status === "funded" || bounty.status === "claimed") && (
          <Button size="lg" variant="outline" onClick={handleRefund} loading={pending}>
            Refund sponsor
          </Button>
        )}
        {["in_review", "merged", "paid", "refunded", "expired"].includes(
          bounty.status,
        ) && (
          <Button size="lg" variant="outline" disabled>
            {bounty.status === "paid"
              ? "Payout complete"
              : bounty.status === "in_review"
                ? "Awaiting PR merge"
                : bounty.status === "merged"
                  ? "Payout pending"
                  : "No action available"}
          </Button>
        )}
      </div>
      {notice && (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-600">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Funding and claiming write to the live mergefi-backend API. Merge
        detection and payout release happen automatically via GitHub
        webhooks once a linked pull request is merged.
      </p>
    </div>
  );
}
