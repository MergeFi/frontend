"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

/**
 * Determines the post-login dashboard route based on the user's assigned roles.
 * Precedence: maintainer > sponsor > contributor.
 * Falls back to the contributor dashboard for empty/missing roles or unknown states.
 */
function getDashboardRoute(roles: UserRole[] | undefined): string {
  if (!roles || roles.length === 0) return "/dashboard/contributor";
  if (roles.includes("maintainer")) return "/dashboard/maintainer";
  if (roles.includes("sponsor")) return "/dashboard/sponsor";
  return "/dashboard/contributor";
}

export function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const loginAttempted = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token || loginAttempted.current) return;
    
    loginAttempted.current = true;
    login(token).catch(() => {
      setError("Could not complete sign-in. Please try again.");
    });
  }, [searchParams, login]);

  useEffect(() => {
    if (!loginAttempted.current || loading) return;
    
    if (error) return;

    if (user) {
      router.replace(getDashboardRoute(user.roles));
    } else {
      // login resolved but user is null (e.g. refresh() failed internally and cleared token).
      // Fallback to contributor dashboard as a sane default to avoid infinite loops or crashes.
      router.replace("/dashboard/contributor");
    }
  }, [user, loading, error, router]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {error ? (
        <>
          <p className="font-medium text-rose-600">{error}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Make sure the mergefi-backend is running and reachable.
          </p>
        </>
      ) : (
        <p className="text-slate-500 dark:text-slate-400">Finishing sign-in…</p>
      )}
    </div>
  );
}
