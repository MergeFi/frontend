"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("No token was returned by GitHub sign-in.");
      return;
    }
    login(token)
      .then(() => router.replace("/dashboard/contributor"))
      .catch(() => setError("Could not complete sign-in. Please try again."));
  }, [searchParams, login, router]);

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
