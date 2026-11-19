import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
 * Format a numeric amount as a currency string with the specified asset label.
 *
 * @param amount - The numeric value to format. Negative values are preserved
 *                 and rendered with a leading minus sign (e.g., -50 → "-50 USDC").
 * @param asset - The asset label to append ("USDC" or "XLM"). Defaults to "USDC".
 * @returns Locale-formatted currency string (e.g., "1,234.56 USDC", "-50 XLM").
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
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${asset}`;
}

/**
 * Parses a locale-formatted money string into a canonical decimal string safe
 * to send to the backend (e.g. "1.234,56" → "1234.56", "1 234,56" → "1234.56").
 *
 * Strategy: probe the runtime locale's decimal separator via Intl, strip
 * thousands separators, replace the decimal separator with ".", then parse.
 * Returns null for empty input or non-numeric values.
 */
export function parseMoneyInput(raw: string, maxDecimals = 7): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parts = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1 })
    .formatToParts(1234567.8);
  const decimalSep = parts.find((p) => p.type === "decimal")?.value ?? ".";
  const groupSep   = parts.find((p) => p.type === "group")?.value   ?? ",";

  const normalized = trimmed
    .replace(new RegExp(`\\${groupSep}`, "g"), "")
    .replace(new RegExp(`\\${decimalSep}`), ".");

  const num = parseFloat(normalized);
  if (isNaN(num)) return null;

  return num.toFixed(maxDecimals).replace(/\.?0+$/, "") || "0";
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
