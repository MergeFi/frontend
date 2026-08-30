import { useState, useCallback } from 'react';
import { apiPost, fetchBounty } from '@/lib/api';
import type { Bounty, ClaimResult } from '@/types/bounty';

interface ApiError {
  status?: number;
  message?: string;
}

export function useClaimRace(bountyId: string, onClaimSuccess?: (bounty: Bounty) => void) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastResult, setLastResult] = useState<ClaimResult | null>(null);

  const claim = useCallback(async (): Promise<ClaimResult> => {
    setIsClaiming(true);
    
    try {
      const response = await apiPost<{ data: Bounty }>(`/bounties/${bountyId}/claim`, {});
      
      const result: ClaimResult = {
        success: true,
        bounty: response.data,
      };
      setLastResult(result);
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
          setLastResult(result);
          return result;
        } catch {
          const result: ClaimResult = {
            success: false,
            error: 'ALREADY_CLAIMED',
          };
          setLastResult(result);
          return result;
        }
      }

      const result: ClaimResult = {
        success: false,
        error: 'NETWORK_ERROR',
        message: apiError?.message || 'Network error occurred',
      };
      setLastResult(result);
      return result;
    } finally {
      setIsClaiming(false);
    }
  }, [bountyId, onClaimSuccess]);

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
