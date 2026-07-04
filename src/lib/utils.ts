import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, asset: "USDC" | "XLM" = "USDC") {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${asset}`;
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function daysUntil(dateIso: string) {
  const diffMs = new Date(dateIso).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
