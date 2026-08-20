"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/context/WalletContext";
import { apiPost, ApiRequestError } from "@/lib/api";

export function MilestoneFundButton({ milestoneId }: { milestoneId: string }) {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState("100");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFund() {
    setError(null);

    // Validate amount before proceeding — mirrors PoolDepositButton validation
    const parsed = Number(amount);
    if (!amount || !Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }
    // Prevent over-precision (Stellar assets support up to 7 decimals)
    if (amount.includes(".") && amount.split(".")[1].length > 7) {
      setError("Amount cannot have more than 7 decimal places.");
      return;
    }

    setPending(true);
    try {
      const walletAddress = address ?? (await connect());
      if (!walletAddress) {
        setError("Connect a Stellar wallet to fund this milestone.");
        return;
      }
      await apiPost(`/milestones/${milestoneId}/fund`, {
        amount,
        funderAddress: walletAddress,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      <input
        type="number"
        min="1"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      />
      <Button size="sm" variant="outline" onClick={handleFund} disabled={pending || connecting}>
        {pending || connecting ? "Confirming..." : "Fund milestone"}
      </Button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function PoolDepositButton({ poolId }: { poolId: string }) {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState("100");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeposit() {
    setError(null);
    setPending(true);
    try {
      const walletAddress = address ?? (await connect());
      if (!walletAddress) {
        setError("Connect a Stellar wallet to deposit.");
        return;
      }
      await apiPost(`/maintenance-pools/${poolId}/deposit`, {
        amount,
        funderAddress: walletAddress,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-2">
      <input
        type="number"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      />
      <Button size="sm" variant="outline" onClick={handleDeposit} disabled={pending || connecting}>
        {pending || connecting ? "Confirming..." : "Deposit"}
      </Button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
