import { useState, useCallback, useRef, useEffect } from 'react';
import { apiPost, fetchBounty } from '@/lib/api';
import type { Bounty, ClaimResult } from '@/types/bounty';

interface ApiError {
  status?: number;
  message?: string;
}

export function useClaimRace(bountyId: string, onClaimSuccess?: (bounty: Bounty) => void) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastResult, setLastResult] = useState<ClaimResult | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const claim = useCallback(async (): Promise<ClaimResult> => {
    if (isMountedRef.current) {
      setIsClaiming(true);
    }
    
    try {
      const response = await apiPost<{ data: Bounty }>(`/bounties/${bountyId}/claim`, {});
      
      const result: ClaimResult = {
        success: true,
        bounty: response.data,
      };
      if (isMountedRef.current) {
        setLastResult(result);
      }
      onClaimSuccess?.(response.data);
      return result;
    } catch (error) {
      const apiError = error as ApiError;
      const isAlreadyClaimed = 
        apiError?.status === 409 || 
        apiError?.message?.toLowerCase().includes('already claimed') ||
        apiError?.message?.toLowerCase().includes('claimed by another user');

      if (isAlreadyClaimed) {
        try {
          const updatedResult = await fetchBounty(bountyId, undefined);
          const result: ClaimResult = {
            success: false,
            error: 'ALREADY_CLAIMED',
            bounty: updatedResult?.data,
          };
          if (isMountedRef.current) {
            setLastResult(result);
          }
          return result;
        } catch {
          const result: ClaimResult = {
            success: false,
            error: 'ALREADY_CLAIMED',
          };
          if (isMountedRef.current) {
            setLastResult(result);
          }
          return result;
        }
      }

      const result: ClaimResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: apiError?.message || 'Network error occurred',
      };
      if (isMountedRef.current) {
        setLastResult(result);
      }
      return result;
    } finally {
      if (isMountedRef.current) {
        setIsClaiming(false);
      }
    }
  }, [bountyId, onClaimSuccess]);

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setLastResult(null);
    }
  }, []);

  return {
    claim,
    isClaiming,
    lastResult,
    reset,
  };
}
