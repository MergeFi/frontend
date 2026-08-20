"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/context/WalletContext";
import { apiPost, ApiRequestError } from "@/lib/api";

export function MilestoneFundButton({ milestoneId }: { milestoneId: string }) {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFund() {
    setError(null);
    setPending(true);
    try {
      const walletAddress = address ?? (await connect());
      if (!walletAddress) {
        setError("Connect a Stellar wallet to fund this milestone.");
        return;
      }
      await apiPost(`/milestones/${milestoneId}/fund`, {
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
    <div className="mt-4">
      <Button size="sm" variant="outline" onClick={handleFund} disabled={pending || connecting}>
        {pending || connecting ? "Confirming in wallet..." : "Fund milestone"}
      </Button>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function PoolDepositButton({ poolId, asset }: { poolId: string; asset: "USDC" | "XLM" }) {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getAmountError(val: string): string | null {
    if (!val) return null; // Don't show error on empty initial state, but button will be disabled
    const parsed = Number(val);
    if (!Number.isFinite(parsed) || parsed <= 0) return "Enter a valid positive amount.";
    if (val.includes(".") && val.split(".")[1].length > (asset === "USDC" ? 2 : 7)) {
      return `Amount exceeds maximum precision for ${asset}.`;
    }
    return null;
  }

  const amountError = getAmountError(amount);
  const isAmountInvalid = !amount || !!amountError;

  async function handleDeposit() {
    setError(null);
    if (isAmountInvalid) return;

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
        step="any"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      />
      <Button size="sm" variant="outline" onClick={handleDeposit} disabled={pending || connecting || isAmountInvalid}>
        {pending || connecting ? "Confirming..." : "Deposit"}
      </Button>
      {(error || amountError) && <p className="text-xs text-rose-600">{error || amountError}</p>}
    </div>
  );
}
