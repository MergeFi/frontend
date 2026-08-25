"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
  maintainer: "/dashboard/maintainer",
  sponsor: "/dashboard/sponsor",
  contributor: "/dashboard/contributor",
};

/** Precedence: maintainer > sponsor > contributor. Falls back to contributor. */
function redirectForRoles(roles: UserRole[] | undefined): string {
  if (!roles || roles.length === 0) return ROLE_REDIRECT_MAP.contributor;
  for (const role of ["maintainer", "sponsor", "contributor"] as UserRole[]) {
    if (roles.includes(role)) return ROLE_REDIRECT_MAP[role];
  }
  return ROLE_REDIRECT_MAP.contributor;
}

export function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("No token was returned by GitHub sign-in.");
      return;
    }

    // Strip the JWT from the URL immediately so it doesn't persist in
    // browser history, referrer headers, or server logs (#9).
    window.history.replaceState({}, "", window.location.pathname);

    login(token)
      .then(() => {
        router.replace(redirectForRoles(user?.roles));
      })
      .catch(() => setError("Could not complete sign-in. Please try again."));
  }, [searchParams, login, router, user]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {error ? (
        <>
          <p className="font-medium text-rose-600">{error}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {error === "No token was returned by GitHub sign-in."
              ? "GitHub did not return an authentication token. Please try signing in again."
              : "Make sure the mergefi-backend is running and reachable."}
          </p>
        </>
      ) : (
        <p className="text-slate-500 dark:text-slate-400">Finishing sign-in…</p>
      )}
    </div>
  );
}
