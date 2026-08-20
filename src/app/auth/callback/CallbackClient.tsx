"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("No token was returned by GitHub sign-in.");
      return;
    }
    login(token)
      .then(() => setJustLoggedIn(true))
      .catch(() => setError("Could not complete sign-in. Please try again."));
  }, [searchParams, login]);

  useEffect(() => {
    if (justLoggedIn && user) {
      const roles = user.roles || [];
      let target = "/dashboard/contributor";
      if (roles.includes("maintainer")) {
        target = "/dashboard/maintainer";
      } else if (roles.includes("sponsor")) {
        target = "/dashboard/sponsor";
      }
      router.replace(target);
    }
  }, [justLoggedIn, user, router]);

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
