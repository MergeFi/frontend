"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  adaptReputation,
  type RawReputationSnapshot,
  type RawUserProfile,
} from "@/lib/adapters";
import type { ReputationProfile } from "@/types";
import { ReputationProfileView } from "./ReputationProfileView";

/**
 * The signed-in user's own reputation profile, fetched client-side with their
 * token. The server-side page render can't reach `/users` (that endpoint needs
 * a JWT the server `request()` doesn't carry), so a real user's own
 * /reputation/<handle> would 404 on the mock fallback. For the own-handle case
 * we render client-side where getToken() supplies the JWT — #713.
 */
export function SelfReputationProfile({ handle }: { handle: string }) {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<ReputationProfile | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    if (loading) return;
    // Only the signed-in user's own handle resolves client-side — other
    // profiles genuinely don't exist for this viewer without the server path.
    if (!user || user.username?.toLowerCase() !== handle.toLowerCase()) {
      setState("notfound");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // The client's apiRequest carries the JWT — the /users lookup the
        // server couldn't authenticate.
        const users =
          await apiRequest<(RawUserProfile & { id: string })[]>("/users");
        const me = users.find(
          (u) => u.username.toLowerCase() === handle.toLowerCase(),
        );
        if (!me) {
          if (!cancelled) setState("notfound");
          return;
        }
        const snapshot = await apiRequest<RawReputationSnapshot | null>(
          `/reputation/${me.id}`,
        );
        if (!cancelled) {
          setProfile(adaptReputation(me, snapshot));
          setState("ok");
        }
      } catch {
        if (!cancelled) setState("notfound");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, handle]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading your reputation…
      </div>
    );
  }
  if (state === "notfound" || !profile) {
    // Not the viewer's own profile (or the fetch genuinely failed) — a real
    // 404. A client component can't call notFound(), so render the not-found
    // state explicitly.
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          Profile not found
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This reputation profile doesn&apos;t exist or isn&apos;t public.
        </p>
      </div>
    );
  }
  return <ReputationProfileView profile={profile} />;
}
