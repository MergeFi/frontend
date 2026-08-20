"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/context/WalletContext";
import { apiPost, ApiRequestError } from "@/lib/api";
import { parseMoneyInput } from "@/lib/utils";

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

export function PoolDepositButton({ poolId, asset = "USDC" }: { poolId: string; asset?: "USDC" | "XLM" }) {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState("100");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate on every change to drive disabled state inline
  const validation = parseMoneyInput(amount, asset);
  const amountValid = validation.valid;

  async function handleDeposit() {
    setError(null);
    if (!amountValid) {
      setError(validation.error ?? "Invalid amount.");
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
        min="1"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={`w-24 rounded-lg border px-3 py-1.5 text-sm focus:outline-none dark:bg-slate-900 dark:text-white ${
          !amountValid && amount !== ""
            ? "border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-400 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
            : "border-slate-200 bg-white text-slate-900 focus:border-indigo-400 dark:border-slate-800"
        }`}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={handleDeposit}
        disabled={pending || connecting || !amountValid}
      >
        {pending || connecting ? "Confirming..." : "Deposit"}
      </Button>
      {(error || (!amountValid && amount !== "")) && (
        <p className="text-xs text-rose-600">{error ?? validation.error}</p>
      )}
    </div>
  );
}
