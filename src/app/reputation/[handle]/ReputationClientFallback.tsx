"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { adaptReputation, type RawReputationSnapshot } from "@/lib/adapters";
import type { ReputationProfile } from "@/types";
import { ReputationProfileView } from "./ReputationProfileView";
import ReputationLoading from "./loading";

interface ReputationClientFallbackProps {
  handle: string;
}

export function ReputationClientFallback({ handle }: ReputationClientFallbackProps) {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<ReputationProfile | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [notFoundTriggered, setNotFoundTriggered] = useState(false);

  useEffect(() => {
    if (loading) return;

    let isCancelled = false;

    if (!user || user.username.toLowerCase() !== handle.toLowerCase()) {
      setTimeout(() => {
        if (!isCancelled) {
          setIsFetching(false);
          setNotFoundTriggered(true);
        }
      }, 0);
      return () => {
        isCancelled = true;
      };
    }

    async function loadReputation() {
      try {
        let snapshot: RawReputationSnapshot | null = null;
        try {
          snapshot = await apiRequest<RawReputationSnapshot | null>(
            `/reputation/${user!.id}/latest`,
          );
        } catch {
          try {
            snapshot = await apiRequest<RawReputationSnapshot | null>(
              `/reputation/${user!.id}`,
            );
          } catch {
            snapshot = null;
          }
        }

        if (!isCancelled) {
          const adapted = adaptReputation(
            {
              username: user!.username,
              avatarUrl: user!.avatarUrl,
            },
            snapshot,
          );
          setProfile(adapted);
          setIsFetching(false);
        }
      } catch {
        if (!isCancelled) {
          setIsFetching(false);
          setNotFoundTriggered(true);
        }
      }
    }

    void loadReputation();

    return () => {
      isCancelled = true;
    };
  }, [user, loading, handle]);

  if (loading || isFetching) {
    return <ReputationLoading />;
  }

  if (notFoundTriggered || !profile) {
    notFound();
    return null;
  }

  return <ReputationProfileView profile={profile} />;
}
