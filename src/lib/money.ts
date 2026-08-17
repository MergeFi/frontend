export interface MoneyInputValidation {
  valid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Validate and normalize a user-entered monetary amount string.
 *
 * @param raw - The raw input string from a form/input.
 * @param asset - The asset ("USDC" or "XLM"). Defaults to "USDC".
 * @returns Validation result with boolean `valid`, `normalized` string, or `error` message.
 */
export function parseMoneyInput(
  raw: string,
  asset: "USDC" | "XLM" = "USDC"
): MoneyInputValidation {
  if (typeof raw !== "string" || !raw.trim()) {
    return { valid: false, error: "Please enter an amount." };
  }

  const trimmed = raw.trim();
  const maxDecimals = asset === "XLM" ? 7 : 2;

  // Check for valid decimal pattern (reject negative signs, exponent notation, letters)
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(trimmed)) {
    if (trimmed.startsWith("-")) {
      return { valid: false, error: "Amount must be greater than 0." };
    }
    return { valid: false, error: "Please enter a valid positive number." };
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const isZero = whole === "0" && (!fraction || /^0+$/.test(fraction));
  if (isZero) {
    return { valid: false, error: "Amount must be greater than 0." };
  }

  if (fraction.length > maxDecimals) {
    return {
      valid: false,
      error: `Maximum ${maxDecimals} decimal places allowed for ${asset}.`,
    };
  }

  const n = Number(trimmed);
  if (!Number.isFinite(n) || n > 100_000_000) {
    return { valid: false, error: "Amount exceeds maximum allowed limit." };
  }

  return { valid: true, normalized: trimmed };
}
