"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/context/WalletContext";
import { apiPost, ApiRequestError } from "@/lib/api";

type Asset = "USDC" | "XLM";

function parseMoneyInput(raw: string, asset: Asset): { valid: boolean; normalized?: string; error?: string } {
  if (!raw || raw.trim() === "") {
    return { valid: false, error: "Amount is required." };
  }
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    return { valid: false, error: "Invalid number." };
  }
  if (num <= 0) {
    return { valid: false, error: "Amount must be greater than 0." };
  }
  
  const maxDecimals = asset === "USDC" ? 2 : 7;
  const parts = raw.split(".");
  if (parts.length > 1 && parts[1].length > maxDecimals) {
    return { valid: false, error: `Max ${maxDecimals} decimal places for ${asset}.` };
  }
  
  // Normalize
  const normalized = num.toFixed(parts.length > 1 ? parts[1].length : 0);
  return { valid: true, normalized };
}

export function MilestoneFundButton({ milestoneId, asset, remainingBudget }: { milestoneId: string; asset: Asset; remainingBudget: number }) {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = parseMoneyInput(amount, asset);
  const overBudget = Number(amount) > remainingBudget;
  const canSubmit = validation.valid && !overBudget && !pending && !connecting;

  async function handleFund() {
    setError(null);
    if (!validation.valid || !validation.normalized) {
      setError(validation.error || "Invalid amount.");
      return;
    }
    if (overBudget) {
      setError("Amount exceeds remaining budget.");
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
    <div className="mt-4 flex items-center gap-2">
      <input
        type="number"
        min="0.01"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`Max ${remainingBudget}`}
        className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      />
      <Button size="sm" variant="outline" onClick={handleFund} disabled={!canSubmit}>
        {pending || connecting ? "Confirming..." : "Fund milestone"}
      </Button>
      {(!validation.valid || overBudget) && amount !== "" && (
        <p className="text-xs text-rose-600">{overBudget ? "Exceeds budget." : validation.error}</p>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function PoolDepositButton({ poolId, asset }: { poolId: string; asset: Asset }) {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState("100");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = parseMoneyInput(amount, asset);
  const canSubmit = validation.valid && !pending && !connecting;

  async function handleDeposit() {
    setError(null);
    if (!validation.valid || !validation.normalized) {
      setError(validation.error || "Invalid amount.");
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
    <div className="mt-4 flex items-center gap-2">
      <input
        type="number"
        min="0.01"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      />
      <Button size="sm" variant="outline" onClick={handleDeposit} disabled={!canSubmit}>
        {pending || connecting ? "Confirming..." : "Deposit"}
      </Button>
      {!validation.valid && amount !== "" && <p className="text-xs text-rose-600">{validation.error}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
