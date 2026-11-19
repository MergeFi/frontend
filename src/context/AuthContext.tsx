"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getToken,
  getTokenSubject,
  setToken as persistToken,
  clearToken,
  TOKEN_KEY,
} from "@/lib/auth";
import { apiRequest, ApiRequestError } from "@/lib/api";
import { useCrossTabStorage } from "@/hooks/useCrossTabStorage";
import type { AuthUser } from "@/types";

/**
 * Backoff between session-resolve attempts (#935). Sized for what the retries
 * exist to ride out — a backend restart or a cold serverless start takes
 * seconds, not the 600ms the old 200/400ms schedule waited in total. Each
 * delay is jittered so tabs that lost the backend together don't retry in
 * lockstep, and the whole loop is capped by wall clock, not attempt count.
 */
const REFRESH_RETRY_DELAYS_MS = [500, 2000, 5000] as const;
const REFRESH_RETRY_BUDGET_MS = 10_000;

/** Transport failures (raw fetch errors, timeouts) and 429/5xx are transient. */
function isRetryableRefreshError(err: unknown): boolean {
  if (!(err instanceof ApiRequestError)) return true;
  return err.status === 0 || err.status === 429 || err.status >= 500;
}

/**
 * Delay before the next attempt, or `null` when the schedule is exhausted.
 * A 429's `Retry-After` is honoured as given; other delays are jittered into
 * `[50%, 100%)` of the scheduled value.
 */
function refreshRetryDelay(err: unknown, attempt: number): number | null {
  if (attempt >= REFRESH_RETRY_DELAYS_MS.length) return null;
  if (err instanceof ApiRequestError && err.retryAfter !== undefined) {
    return err.retryAfter * 1000;
  }
  const base = REFRESH_RETRY_DELAYS_MS[attempt];
  return Math.round(base * (0.5 + Math.random() * 0.5));
}

interface AuthContextValue {
  user: AuthUser | null;
  /**
   * `true` while the session is still unresolved and the UI must not commit to
   * a signed-in *or* signed-out appearance.
   *
   * This covers both the initial mount hydration and any in-flight re-resolve
   * (sign-in token exchange, cross-tab login). It previously only ever went
   * `true → false` because `refresh()` never set it back, so for the whole
   * duration of the GitHub OAuth round trip the Navbar rendered its
   * logged-out CTAs — including a live "Connect GitHub" button that would
   * re-enter the very OAuth flow the user had just completed.
   */
  loading: boolean;
  /** True when the auth backend is unreachable and the session state is uncertain (#587) */
  degraded: boolean;
  login: (token: string) => Promise<AuthUser | null>;
  logout: () => void;
  // Resolves with the session's user (null when there's no valid token, after
  // a 401/403, or when all retries are exhausted) — CallbackClient awaits
  // login() and redirects on the *resolved* user, so this must not be
  // Promise<void> or the role-based redirect silently degrades to the
  // contributor fallback.
  refresh: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);

  // `refresh()` is called from three independent places (mount hydration,
  // login, cross-tab) that can overlap. Count in-flight calls so `loading`
  // only clears once the *last* one settles — otherwise a fast cross-tab
  // refresh would flip loading false while the mount refresh was still
  // running, and the UI would briefly commit to a signed-out render.
  const inFlight = useRef(0);

  const beginResolve = useCallback(() => {
    inFlight.current += 1;
    setLoading(true);
  }, []);

  const endResolve = useCallback(() => {
    inFlight.current = Math.max(0, inFlight.current - 1);
    if (inFlight.current === 0) setLoading(false);
  }, []);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      // #882 — loading is cleared by endResolve, never here: a direct
      // setLoading(false) bypasses the in-flight counter and flips the UI
      // signed-out while a concurrent refresh is still running.
      setDegraded(false);
      return null;
    }
    // `/auth/me` only returns `{ userId, username }`, so resolving a session
    // through it costs two sequential requests. The JWT already carries the
    // user id in `sub`; fetch the profile directly and keep `/auth/me` as the
    // fallback for tokens whose subject can't be decoded.
    const subject = getTokenSubject(token);
    const deadline = Date.now() + REFRESH_RETRY_BUDGET_MS;
    for (let attempt = 0; attempt <= REFRESH_RETRY_DELAYS_MS.length; attempt++) {
      try {
        const userId =
          subject ??
          (await apiRequest<{ userId: string; username: string }>("/auth/me")).userId;
        const profile = await apiRequest<AuthUser>(`/users/${userId}`);
        // #883 — never commit a resolve for a token that has since changed
        // (cross-tab switch); the new token's own refresh owns the state.
        if (getToken() !== token) return null;
        setUser(profile);
        setDegraded(false);
        return profile;
      } catch (err) {
        // Only clear the token on genuine auth failures (401/403).
        // Network errors, timeouts, and transient server errors should
        // retry — silently logging the user out on a flaky connection
        // was a significant UX issue (#4).
        if (err instanceof ApiRequestError && (err.status === 401 || err.status === 403)) {
          // #883 — only tear down the session if this is still the active
          // token; otherwise a stale 401 would sign out the new account.
          if (getToken() === token) {
            clearToken();
            setUser(null);
            setDegraded(false);
          }
          return null;
        }
        // #935 — a 400/404/422 (malformed subject, deleted user) will not
        // change on a retry; only transport failures, timeouts, 429 and 5xx
        // are worth waiting out.
        if (!isRetryableRefreshError(err)) break;
        const delay = refreshRetryDelay(err, attempt);
        if (delay === null || Date.now() + delay > deadline) break;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    // All retries exhausted. The token is still valid as far as we know, but we
    // could not resolve a profile. Mark the session degraded rather than
    // letting `user === null` read as "signed out": every dashboard's
    // `if (!user)` branch renders mock data, so a transient outage would
    // otherwise present fabricated numbers as the user's own.
    // #883 — stale resolve (token changed mid-flight): leave state to the new
    // token's own refresh.
    if (getToken() !== token) return null;
    // #883 — if the failed token belongs to a *different* account than the one
    // on screen (cross-tab switch), the previous profile must not survive:
    // the UI would show account A's identity while requests carry B's token.
    // For the current account, keep `user` and degrade instead.
    setUser((prev) => (prev && subject && prev.id !== subject ? null : prev));
    setDegraded(true);
    return null;
  }, []);

  useEffect(() => {
    // Session hydration on mount: reads the JWT from localStorage and
    // resolves the current user. Deferred by a tick (#223) so it runs after
    // the initial commit instead of on the critical path to interactivity —
    // every route mounts this provider, including static marketing pages.
    const id = window.setTimeout(() => {
      beginResolve();
      void refresh().finally(endResolve);
    }, 0);
    return () => window.clearTimeout(id);
  }, [refresh, beginResolve, endResolve]);

  const handleTokenChangedElsewhere = useCallback(
    (newValue: string | null) => {
      if (newValue === null) {
        // Token cleared in another tab (logout there) — sign out here too.
        setUser(null);
        setDegraded(false);
      } else {
        // Token set/changed in another tab (login, or a different account)
        // — re-resolve whose session this now is. This raises `loading` so
        // consumers show a neutral pending state rather than the previous
        // account's chrome or a signed-out flash.
        beginResolve();
        void refresh().finally(endResolve);
      }
    },
    [refresh, beginResolve, endResolve],
  );
  useCrossTabStorage(TOKEN_KEY, handleTokenChangedElsewhere);

  const login = useCallback(
    async (token: string): Promise<AuthUser | null> => {
      persistToken(token);
      // `loading` is raised for the token exchange, not left false. Without
      // this the Navbar and ConnectPanel render their signed-out layout for
      // the whole round trip, showing a clickable "Connect GitHub" button
      // while the user is mid-sign-in (#456).
      beginResolve();
      try {
        return await refresh();
      } finally {
        endResolve();
      }
    },
    [refresh, beginResolve, endResolve],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setDegraded(false);
  }, []);

  // #885 — memoized so auth state changes re-render only consumers that
  // actually read the changed fields, not every useAuth() subscriber.
  const value = useMemo(
    () => ({ user, loading, login, logout, refresh, degraded }),
    [user, loading, degraded, login, logout, refresh],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
