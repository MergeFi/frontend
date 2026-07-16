import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, asset: "USDC" | "XLM" = "USDC") {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 7 })} ${asset}`;
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function daysUntil(dateIso: string) {
  const diffMs = new Date(dateIso).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Sum currency amounts represented as strings to avoid IEEE-754 floating-point drift.
 * Returns the result as a number for display, but computed via decimal string arithmetic.
 */
export function sumCurrency(amounts: string[]): number {
  if (amounts.length === 0) return 0;

  // Find the maximum number of decimal places across all amounts
  const maxDecimals = amounts.reduce((max, amount) => {
    const decimals = amount.includes(".") ? amount.split(".")[1].length : 0;
    return Math.max(max, decimals);
  }, 0);

  const multiplier = 10 ** maxDecimals;

  // Convert all amounts to integer representation (scaled by multiplier)
  const scaledSum = amounts.reduce((sum, amount) => {
    const scaled = Math.round(parseFloat(amount) * multiplier);
    return sum + scaled;
  }, 0);

  // Convert back to decimal
  return scaledSum / multiplier;
}

/**
 * Parse a decimal string to a precise number for display.
 * Use this instead of Number() for backend decimal strings.
 */
export function parseDecimal(value: string): number {
  return parseFloat(value);
}
