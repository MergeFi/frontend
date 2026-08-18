
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type CurrencyAsset = "USDC" | "XLM";

const XLM_STROOP = 0.0000001;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function coerceDecimal(value: string | null | undefined, fallback = 0): number {
  if (value == null) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export function coerceNonNegative(value: string | null | undefined, fallback = 0): number {
  const n = coerceDecimal(value, fallback);
  return n < 0 ? fallback : n;
}

export function coerceFraction(value: string | null | undefined, fallback = 0): number {
  const n = coerceDecimal(value, fallback);
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function coercePercentage(value: string | null | undefined, fallback = 0): number {
  const n = coerceDecimal(value, fallback);
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/**
 * Format a numeric amount for both visible display and an exact-value tooltip.
 *
 * USDC keeps the existing two-decimal visible policy. XLM is displayed with up
 * to seven decimal places, matching Stellar's stroop precision. A finite,
 * non-zero XLM value smaller than one stroop is shown as a bounded value rather
 * than the misleading literal "0 XLM".
 */
export function formatCurrencyParts(
  amount: number,
  asset: CurrencyAsset = "USDC",
): { display: string; exact: string } {
  if (!Number.isFinite(amount)) {
    const zero = `0 ${asset}`;
    return { display: zero, exact: zero };
  }

  if (asset === "XLM" && amount !== 0 && Math.abs(amount) < XLM_STROOP) {
    const bounded = amount < 0 ? `>-0.0000001 ${asset}` : `<0.0000001 ${asset}`;
    return { display: bounded, exact: bounded };
  }

  const displayDigits = asset === "XLM" ? 7 : 2;
  const exactDigits = asset === "XLM" ? 7 : 6;
  const display = `${amount.toLocaleString("en-US", {
    maximumFractionDigits: displayDigits,
  })} ${asset}`;
  const exact = `${amount.toLocaleString("en-US", {
    maximumFractionDigits: exactDigits,
  })} ${asset}`;
  return { display, exact };
}

/**
 * Format a numeric amount as a currency string with the specified asset label.
 * Negative values are preserved rather than silently converted to positives.
 */
export function formatCurrency(amount: number, asset: CurrencyAsset = "USDC") {
  return formatCurrencyParts(amount, asset).display;
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

export function daysUntil(dateIso: string) {
  const diffMs = new Date(dateIso).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function validateTeamSplits(
  splits: Array<{ percentage: string | number }>,
  tolerance = 0.01
): { valid: boolean; sum: number; message?: string } {
  if (!splits || splits.length === 0) return { valid: true, sum: 0 };
  const percentages = splits.map((s) =>
    typeof s.percentage === "string" ? Number(s.percentage) : s.percentage
  );
  const sum = percentages.reduce((a, b) => a + b, 0);
  const valid = Math.abs(sum - 100) <= tolerance;
  return {
    valid,
    sum,
    message: valid ? undefined : `Team splits sum to ${sum.toFixed(2)}% (expected 100%)`,
  };
}
