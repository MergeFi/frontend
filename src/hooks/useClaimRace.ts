import { useState, useCallback, useEffect, useRef } from 'react';
import { apiPost, fetchBounty } from '@/lib/api';
import { generateIdempotencyKey } from '@/lib/utils';
import type { Bounty, ClaimResult } from '@/types/bounty';

interface ApiError {
  status?: number;
  message?: string;
}

export function useClaimRace(bountyId: string, onClaimSuccess?: (bounty: Bounty) => void) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastResult, setLastResult] = useState<ClaimResult | null>(null);
  // Mirrors useSmartPolling (#361): the claim request can still be in flight
  // when the caller unmounts (e.g. navigating away right after "Claim"), so
  // skip state updates once unmounted. Set to true in the effect body too so
  // React Strict Mode's simulated unmount/remount doesn't leave it false.
  const isMountedRef = useRef(true);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset idempotency key when the active bounty changes
  useEffect(() => {
    idempotencyKeyRef.current = null;
  }, [bountyId]);

  const recordResult = useCallback((result: ClaimResult) => {
    if (isMountedRef.current) {
      setLastResult(result);
    }
    return result;
  }, []);

  const claim = useCallback(async (): Promise<ClaimResult> => {
    setIsClaiming(true);

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
    }
    const idempotencyKey = idempotencyKeyRef.current;

    try {
      const response = await apiPost<{ data: Bounty }>(
        `/bounties/${bountyId}/claim`,
        {},
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        },
      );

      idempotencyKeyRef.current = null;

      const result: ClaimResult = {
        success: true,
        bounty: response.data,
      };
      recordResult(result);
      if (isMountedRef.current) {
        onClaimSuccess?.(response.data);
      }
      return result;
    } catch (error) {
      const apiError = error as ApiError;
      const isAlreadyClaimed = 
        apiError?.status === 409 || 
        apiError?.message?.toLowerCase().includes('already claimed') ||
        apiError?.message?.toLowerCase().includes('claimed by another user');

      if (isAlreadyClaimed) {
        idempotencyKeyRef.current = null;
        try {
          const updatedResult = await fetchBounty(bountyId, undefined);
          const result: ClaimResult = {
            success: false,
            error: 'ALREADY_CLAIMED',
            bounty: updatedResult?.data,
          };
          return recordResult(result);
        } catch {
          const result: ClaimResult = {
            success: false,
            error: 'ALREADY_CLAIMED',
          };
          return recordResult(result);
        }
      }

      const result: ClaimResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: apiError?.message || 'Network error occurred',
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
  }, []);

  return {
    claim,
    isClaiming,
    lastResult,
    reset,
  };
}
