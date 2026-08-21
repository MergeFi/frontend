"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/context/WalletContext";
import { apiPost, ApiRequestError } from "@/lib/api";
import { parseMoneyInput } from "@/lib/money";

interface MilestoneFundButtonProps {
  milestoneId: string;
  asset?: "USDC" | "XLM";
  suggestedAmount?: number;
}

export function MilestoneFundButton({
  milestoneId,
  asset = "USDC",
  suggestedAmount,
}: MilestoneFundButtonProps) {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState(suggestedAmount ? String(suggestedAmount) : "100");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = parseMoneyInput(amount, asset);

  async function handleFund() {
    setError(null);
    if (!validation.valid || !validation.normalized) {
      setError(validation.error || "Please enter a valid amount.");
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
        amount: validation.normalized,
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
    <div className="mt-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          step="any"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Amount"
          aria-label="Milestone funding amount"
          className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleFund}
          disabled={pending || connecting || !validation.valid}
        >
          {pending || connecting ? "Confirming..." : "Fund milestone"}
        </Button>
      </div>
      {(!validation.valid && amount.trim().length > 0) && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{validation.error}</p>
      )}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

interface PoolDepositButtonProps {
  poolId: string;
  asset?: "USDC" | "XLM";
}

export function PoolDepositButton({ poolId, asset = "USDC" }: PoolDepositButtonProps) {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState("100");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = parseMoneyInput(amount, asset);

  async function handleDeposit() {
    setError(null);
    if (!validation.valid || !validation.normalized) {
      setError(validation.error || "Please enter a valid amount.");
      return;
    }

    setPending(true);
    try {
      const walletAddress = address ?? (await connect());
      if (!walletAddress) {
        setError("Connect a Stellar wallet to deposit.");
        return;
      }
      await apiPost(`/maintenance-pools/${poolId}/deposit`, {
        amount: validation.normalized,
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
    <div className="mt-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          step="any"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Amount"
          aria-label="Maintenance pool deposit amount"
          className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleDeposit}
          disabled={pending || connecting || !validation.valid}
        >
          {pending || connecting ? "Confirming..." : "Deposit"}
        </Button>
      </div>
      {(!validation.valid && amount.trim().length > 0) && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{validation.error}</p>
      )}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
