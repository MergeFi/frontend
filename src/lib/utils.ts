import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BountyStatus } from "@/types";

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
 * Soft ceiling for currency display. Values above this are likely corrupted,
 * misconfigured (e.g. sent in base units instead of whole units), or a
 * backend data-entry error. formatCurrency appends a warning indicator.
 */
const SANITY_CEILING = 1_000_000_000; // 1 billion

/**
 * Format a numeric amount as a currency string with the specified asset label.
 *
 * @param amount - The numeric value to format. Negative values are preserved
 *                 and rendered with a leading minus sign (e.g., -50 → "-50 USDC").
 * @param asset - The asset label to append ("USDC" or "XLM"). Defaults to "USDC".
 * @returns Locale-formatted currency string (e.g., "1,234.56 USDC", "-50 XLM").
 *          Values above the sanity ceiling are suffixed with " ⚠" to flag
 *          implausibly large figures that may indicate corrupted data.
 *
 * @remarks
 * This function deliberately preserves the sign of negative amounts rather than
 * silently discarding it via Math.abs(). Financial systems may legitimately
 * display negative figures for:
 * - Net-negative sponsor balances (refunds exceeding deposits)
 * - Accounting corrections or adjustments
 * - Deltas or changes (e.g., budget remaining after overspending)
 *
 * This behavior matches StatCard's internal currency formatter, ensuring
 * consistency across the app. The same negative input will now render
 * identically whether formatted by formatCurrency() or StatCard.
 */
export function formatCurrency(amount: number, asset: "USDC" | "XLM" = "USDC") {
  if (!Number.isFinite(amount)) return `0 ${asset}`;
  const maxDecimals = asset === "XLM" ? 7 : 2;
  const formatted = amount.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
  if (Math.abs(amount) > SANITY_CEILING) return `${formatted} ${asset} ⚠`;
  return `${formatted} ${asset}`;
}

/**
 * Check whether a currency amount is within a plausible range.
 * Useful for conditionally rendering a warning badge or tooltip.
 */
export function isPlausibleAmount(amount: number): boolean {
  return Number.isFinite(amount) && Math.abs(amount) <= SANITY_CEILING;
}

/**
 * Validate and normalize a monetary amount string entered by a user.
 *
 * Returns a result object indicating whether the input is valid, and if so,
 * the normalized canonical decimal string suitable for sending to the backend.
 *
 * @param raw - The raw string from a number input.
 * @param asset - The asset type, which determines the maximum fractional precision.
 *                USDC: 2 decimals, XLM: 7 decimals.
 */
export function parseMoneyInput(
  raw: string,
  asset: "USDC" | "XLM" = "USDC",
): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return { valid: false, error: "Enter a deposit amount." };
  }

  const num = Number(trimmed);

  if (!Number.isFinite(num)) {
    return { valid: false, error: "Enter a valid number." };
  }

  if (num <= 0) {
    return { valid: false, error: "Amount must be greater than zero." };
  }

  const maxDecimals = asset === "XLM" ? 7 : 2;
  const decimalPart = trimmed.includes(".") ? trimmed.split(".")[1] : "";

  if (decimalPart.length > maxDecimals) {
    return {
      valid: false,
      error: `${asset} supports up to ${maxDecimals} decimal places.`,
    };
  }

  // Normalize: convert to a canonical decimal string with the right precision.
  // Use toLocaleString with fixed fraction digits to get a clean representation,
  // then strip thousands separators.
  const normalized = num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).replace(/,/g, "");

  return { valid: true, normalized };
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

export function daysUntil(dateIso: string) {
  const diffMs = new Date(dateIso).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDaysUntil(days: number | null): string {
  if (days === null) return "No deadline";
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} left`;
  return "Deadline passed";
}

const VALID_STATUSES: ReadonlySet<string> = new Set<BountyStatus>([
  "open",
  "funded",
  "claimed",
  "in_review",
  "merged",
  "paid",
  "refunded",
  "expired",
]);

/**
 * Validate that a raw status string is a known BountyStatus. Returns the
 * validated status or falls back to "open" for unrecognized values (#279).
 */
export function coerceStatus(value: string | null | undefined): BountyStatus {
  if (value && VALID_STATUSES.has(value)) return value as BountyStatus;
  return "open";
}

export function validateTeamSplits(
  splits: Array<{ percentage: string | number }>,
  tolerance = 0.01
): { valid: boolean; sum: number; message?: string } {
  if (!splits || splits.length === 0) return { valid: true, sum: 0 };
  // coerceDecimal degrades a malformed percentage string to 0 instead of
  // NaN, so one bad split can't poison the whole sum into "NaN%" (#198).
  const percentages = splits.map((s) =>
    typeof s.percentage === "string" ? coerceDecimal(s.percentage) : s.percentage
  );
  const sum = percentages.reduce((a, b) => a + b, 0);
  const valid = Math.abs(sum - 100) <= tolerance;
  return {
    valid,
    sum,
    message: valid ? undefined : `Team splits sum to ${sum.toFixed(2)}% (expected 100%)`,
  };
}
