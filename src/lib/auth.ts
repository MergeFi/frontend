export const TOKEN_KEY = "mergefi_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    // Reads are best-effort (e.g. Safari private browsing, disabled storage).
    return null;
  }
}

export function setToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Persistence is best-effort; the token still works for the current
    // in-memory session even if it can't be written to storage.
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Best-effort, same as setToken above.
  }
}

/**
 * Where to send the user after GitHub sign-in (#700). A bounty page's
 * sign-in CTA goes /connect -> GitHub OAuth -> /auth/callback — a full
 * cross-origin redirect, so the bounty path can't ride the query string all
 * the way through. Stash it in localStorage before the OAuth hop and consume
 * it in the callback. Same-origin tab → the stash survives the round-trip.
 */
const RETURN_TO_KEY = "mergefi_oauth_return_to";

/** Only a safe, same-origin path may be returned to — reject absolute URLs/protocol-relative so an attacker can't redirect off-site. */
function isSafeReturnTo(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export function stashReturnTo(path: string) {
  try {
    if (isSafeReturnTo(path)) {
      window.sessionStorage.setItem(RETURN_TO_KEY, path);
    }
  } catch {
    // best-effort
  }
}

export function consumeReturnTo(): string | null {
  try {
    const v = window.sessionStorage.getItem(RETURN_TO_KEY);
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    return v && isSafeReturnTo(v) ? v : null;
  } catch {
    return null;
  }
}
