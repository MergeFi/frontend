"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { apiPost, apiRequest, ApiRequestError } from "@/lib/api";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import type { Bounty, BountyStatus } from "@/types";

/**
 * Claim-race detection (Issue #46):
 * When a claim attempt fails because another user claimed first, the backend
 * returns a 409 Conflict or a message containing "already claimed". We detect
 * this specifically and show a distinct UI rather than a generic error.
 *
 * If the backend doesn't distinguish this case yet, this code treats any 409
 * or message matching /already.?claimed|claim.*race/i as a race loss.
 * Backend contract note: ideally return { code: "CLAIM_RACE_LOST", status: "claimed", claimedBy: "..." }
 */
function isClaimRaceLoss(err: unknown): boolean {
  if (err instanceof ApiRequestError) {
    if (err.status === 409) return true;
    if (/already.?claimed|claim.*race|already.*taken/i.test(err.message)) return true;
  }
  return false;
}

export function IssueActions({ bounty }: { bounty: Bounty }) {
  const router = useRouter();
  const { user } = useAuth();
  const { address, connect, connecting } = useWallet();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [raceLost, setRaceLost] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<BountyStatus>(bounty.status);
  const statusRef = useRef(bounty.status);

  // Smart polling: re-fetch bounty status every 5s when visible, backing off
  // if unchanged. This keeps the claim button state accurate without manual refresh.
  const fetchStatus = useCallback(async () => {
    try {
      const updated = await apiRequest<{ status: BountyStatus; claimedBy?: string | null }>(
        `/bounties/${bounty.id}/status`,
      );
      if (updated.status !== statusRef.current) {
        statusRef.current = updated.status;
        setCurrentStatus(updated.status);
        signalChange();
      } else {
        signalNoChange();
      }
    } catch {
      // Silently ignore polling errors — don't disrupt the UI
    }
  }, [bounty.id]);

  const { signalChange, signalNoChange } = useSmartPolling(fetchStatus, {
    interval: 5000,
    maxBackoff: 12,
    // Only poll when viewing an actionable bounty state
    enabled: ["open", "funded", "claimed"].includes(currentStatus),
  });

  async function withWallet(action: (walletAddress: string) => Promise<void>) {
    setError(null);
    setNotice(null);
    setRaceLost(false);
    setPending(true);
    try {
      const walletAddress = address ?? (await connect());
      if (!walletAddress) {
        setError("Connect a Stellar wallet to continue.");
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
      await apiPost(`/bounties/${bounty.id}/fund`, { funderAddress: walletAddress });
      setNotice("Escrow funded on-chain. This bounty is now open for claims.");
    });
  }

  async function handleClaim() {
    setError(null);
    setNotice(null);
    setRaceLost(false);
    if (!user) {
      router.push("/connect");
      return;
    }
    setPending(true);
    try {
      await apiPost(`/bounties/${bounty.id}/claim`, { contributorId: user.id });
      setNotice("You've claimed this issue. Open a pull request to get started.");
      router.refresh();
    } catch (err) {
      if (isClaimRaceLoss(err)) {
        setRaceLost(true);
        // Force an immediate status refresh to show the new claimant
        await fetchStatus();
      } else {
        setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
      }
    } finally {
      setPending(false);
    }
  }

  async function handleRefund() {
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      await apiPost(`/bounties/${bounty.id}/refund`);
      setNotice("Escrowed funds were refunded to the sponsor.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  // Use polled status for rendering decisions, fall back to prop
  const displayStatus = currentStatus;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-3">
        {displayStatus === "open" && (
          <Button size="lg" onClick={handleFund} disabled={pending || connecting}>
            {pending || connecting ? "Confirming in wallet..." : "Fund this bounty"}
          </Button>
        )}
        {displayStatus === "funded" && (
          <Button size="lg" onClick={handleClaim} disabled={pending}>
            {pending ? "Claiming..." : "Claim this issue"}
          </Button>
        )}
        {(displayStatus === "funded" || displayStatus === "claimed") && (
          <Button size="lg" variant="outline" onClick={handleRefund} disabled={pending}>
            Refund sponsor
          </Button>
        )}
        {["in_review", "merged", "paid", "refunded", "expired"].includes(displayStatus) && (
          <Button size="lg" variant="outline" disabled>
            {displayStatus === "paid"
              ? "Payout complete"
              : displayStatus === "in_review"
                ? "Awaiting PR merge"
                : "No action available"}
          </Button>
        )}
      </div>

      {/* Claim-race-specific messaging — distinct from generic errors */}
      {raceLost && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <strong>Someone else claimed this bounty first.</strong> The status has been updated.
          You can look for other open bounties to claim.
        </div>
      )}

      {notice && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}
      {error && !raceLost && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Funding and claiming write to the live mergefi-backend API. Merge
        detection and payout release happen automatically via GitHub
        webhooks once a linked pull request is merged. Status auto-refreshes
        while this page is active.
      </p>
    </div>
  );
}
