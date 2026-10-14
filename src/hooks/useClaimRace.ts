import { useState, useCallback, useEffect, useRef } from 'react';
import { apiPost, fetchBounty } from '@/lib/api';
import { adaptBounty, type RawBounty } from '@/lib/adapters';
import { generateIdempotencyKey } from '@/lib/utils';
import type { Bounty, ClaimResult } from '@/types/bounty';

interface ApiError {
  status?: number;
  message?: string;
}

export function useClaimRace(
  bountyId: string,
  onClaimSuccess?: (bounty: Bounty) => void,
) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastResult, setLastResult] = useState<ClaimResult | null>(null);
  // Mirrors useSmartPolling (#361): the claim request can still be in flight
  // when the caller unmounts (e.g. navigating away right after "Claim"), so
  // skip state updates once unmounted. Set to true in the effect body too so
  // React Strict Mode's simulated unmount/remount doesn't leave it false.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const recordResult = useCallback((result: ClaimResult) => {
    if (isMountedRef.current) {
      setLastResult(result);
    }
    return result;
  }, []);

  // The claim needs a stable Idempotency-Key per claim-intent — the backend's
  // @Idempotent('bounty.claim') interceptor requires the Idempotency-Key UUID
  // header and 400s without it, so the claim could never succeed (#698). The
  // key is generated once per intent and REUSED across a retry — that's what
  // makes the retry idempotent (same key → the backend returns the first
  // attempt's result instead of a double-claim).
  const idempotencyKeyRef = useRef<string | null>(null);

  const claim = useCallback(async (): Promise<ClaimResult> => {
    setIsClaiming(true);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
    }
    try {
      const raw = await apiPost<RawBounty>(
        `/bounties/${bountyId}/claim`,
        {},
        idempotencyKeyRef.current,
      );

      const bounty = adaptBounty(raw);
      const result: ClaimResult = {
        success: true,
        bounty,
      };
      recordResult(result);
      if (isMountedRef.current) {
        onClaimSuccess?.(bounty);
      }
      return result;
    } catch (error) {
      const apiError = error as ApiError;
      const isAlreadyClaimed =
        apiError?.status === 409 ||
        apiError?.message?.toLowerCase().includes("already claimed") ||
        apiError?.message?.toLowerCase().includes("claimed by another user");

      if (isAlreadyClaimed) {
        try {
          const updatedResult = await fetchBounty(bountyId, undefined);
          const result: ClaimResult = {
            success: false,
            error: "ALREADY_CLAIMED",
            bounty: updatedResult?.data,
          };
          return recordResult(result);
        } catch {
          const result: ClaimResult = {
            success: false,
            error: "ALREADY_CLAIMED",
          };
          return recordResult(result);
        }
      }

      const result: ClaimResult = {
        success: false,
        error: "NETWORK_ERROR",
        message: apiError?.message || "Network error occurred",
      };
      return recordResult(result);
    } finally {
      if (isMountedRef.current) {
        setIsClaiming(false);
      }
    }
  }, [bountyId, onClaimSuccess, recordResult]);

  const reset = useCallback(() => {
    setLastResult(null);
    // A new claim-intent gets a fresh idempotency key.
    idempotencyKeyRef.current = null;
  }, []);

  return {
    claim,
    isClaiming,
    lastResult,
    reset,
  };
}
