"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useWalletAction } from "@/hooks/useWalletAction";
import { apiPost } from "@/lib/api";
import { parseMoneyInput, generateIdempotencyKey } from "@/lib/utils";

export function MilestoneFundButton({
  milestoneId,
  milestoneName,
}: {
  milestoneId: string;
  milestoneName?: string;
}) {
  const { execute: withWallet, pending, connecting, error } = useWalletAction({
    defaultConnectError: "Connect a Stellar wallet to fund this milestone.",
  });

  async function handleFund() {
    await withWallet(async (walletAddress) => {
      await apiPost(`/milestones/${milestoneId}/fund`, {
        funderAddress: walletAddress,
        idempotencyKey: generateIdempotencyKey(),
      });
    });
  }

  return (
    <div className="mt-4">
      <Button
        size="sm"
        variant="outline"
        onClick={handleFund}
        loading={pending || connecting}
        aria-label={milestoneName ? `Fund milestone: ${milestoneName}` : "Fund milestone"}
      >
        {pending || connecting ? "Confirming in wallet..." : "Fund milestone"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function PoolDepositButton({
  poolId,
  poolRepo,
  asset = "USDC",
}: {
  poolId: string;
  poolRepo?: string;
  asset?: "USDC" | "XLM";
}) {
  const [amount, setAmount] = useState("100");
  const [inputError, setInputError] = useState<string | null>(null);

  const {
    execute: withWallet,
    pending,
    connecting,
    error: walletError,
    setError: setWalletError,
  } = useWalletAction({
    defaultConnectError: "Connect a Stellar wallet to deposit.",
  });

  const error = inputError ?? walletError;

  const validation = parseMoneyInput(amount, asset);
  const inputValid = validation.valid;

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    setInputError(null);
    setWalletError(null);
  }

  async function handleDeposit() {
    setInputError(null);
    // Re-validate at submit time in case state drifted
    const result = parseMoneyInput(amount, asset);
    if (!result.valid) {
      setInputError(result.error ?? "Invalid amount.");
      return;
    }

    await withWallet(async (walletAddress) => {
      await apiPost(`/maintenance-pools/${poolId}/deposit`, {
        amount: result.normalized,
        funderAddress: walletAddress,
        idempotencyKey: generateIdempotencyKey(),
      });
    });
  }

  const inputId = `pool-deposit-${poolId}`;

  return (
    <div className="mt-4 flex items-center gap-2">
      <label htmlFor={inputId} className="sr-only">
        Deposit amount
      </label>
      <input
        id={inputId}
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={handleAmountChange}
        className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={handleDeposit}
        loading={pending || connecting}
        disabled={!inputValid}
        aria-label={poolRepo ? `Deposit to pool: ${poolRepo}` : "Deposit to pool"}
      >
        {pending || connecting ? "Confirming..." : "Deposit"}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
