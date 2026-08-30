'use client';

import React, { useState, useEffect, useRef, useReducer } from 'react';
import { useClaimRace } from '@/hooks/useClaimRace';
import { useBountyStatus } from '@/hooks/useBountyStatus';
import type { Bounty } from '@/types/bounty';

interface ClaimButtonProps {
  bountyId: string;
  fallbackBounty?: Bounty;
  onClaimSuccess?: () => void;
  className?: string;
}

type ClaimState = {
  showRaceMessage: boolean;
  claimSuccess: boolean;
};

type ClaimAction = 
  | { type: 'SHOW_RACE_MESSAGE' }
  | { type: 'HIDE_RACE_MESSAGE' }
  | { type: 'SHOW_CLAIM_SUCCESS' }
  | { type: 'HIDE_CLAIM_SUCCESS' }
  | { type: 'RESET' };

const initialState: ClaimState = {
  showRaceMessage: false,
  claimSuccess: false,
};

function claimReducer(state: ClaimState, action: ClaimAction): ClaimState {
  switch (action.type) {
    case 'SHOW_RACE_MESSAGE':
      return { ...state, showRaceMessage: true };
    case 'HIDE_RACE_MESSAGE':
      return { ...state, showRaceMessage: false };
    case 'SHOW_CLAIM_SUCCESS':
      return { ...state, claimSuccess: true };
    case 'HIDE_CLAIM_SUCCESS':
      return { ...state, claimSuccess: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function ClaimButton({ 
  bountyId, 
  fallbackBounty,
  onClaimSuccess, 
  className = '' 
}: ClaimButtonProps) {
  const { claim, isClaiming, lastResult, reset } = useClaimRace(bountyId);
  const { bounty, refetch, status, isPolling } = useBountyStatus({
    bountyId,
    fallbackBounty,
    interval: 2000,
  });

  const [state, dispatch] = useReducer(claimReducer, initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle result changes
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (lastResult?.success === false && lastResult.error === 'ALREADY_CLAIMED') {
      dispatch({ type: 'SHOW_RACE_MESSAGE' });
      refetch();
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'HIDE_RACE_MESSAGE' });
        reset();
      }, 15000);
    } else if (lastResult?.success === true) {
      dispatch({ type: 'SHOW_CLAIM_SUCCESS' });
      refetch();
      if (onClaimSuccess) {
        onClaimSuccess();
      }
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'HIDE_CLAIM_SUCCESS' });
        reset();
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [lastResult, refetch, reset, onClaimSuccess]);

  const handleClaim = async () => {
    dispatch({ type: 'RESET' });
    reset();
    await claim();
  };

  const isDisabled = isClaiming || status === 'claimed' || status === 'completed';

  if (status === 'claimed' || status === 'completed') {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <p className="text-gray-600">
          This bounty has already been <span className="font-medium">{status}</span>
        </p>
        {bounty?.claimedBy && (
          <p className="text-sm text-gray-500 mt-1">
            Claimed by: {bounty.claimedBy}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {state.showRaceMessage && lastResult?.success === false && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏃</span>
            <div>
              <h4 className="text-red-700 font-semibold">
                Someone else claimed this bounty first!
              </h4>
              <p className="text-red-600 text-sm mt-1">
                The bounty has been claimed by another contributor. 
                The status has been updated below.
              </p>
              <button 
                onClick={() => dispatch({ type: 'HIDE_RACE_MESSAGE' })}
                className="mt-2 text-sm text-red-500 hover:text-red-700 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {state.claimSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="text-green-700 font-semibold">Successfully claimed!</h4>
              <p className="text-green-600 text-sm mt-1">
                You have claimed this bounty. Good luck!
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={isDisabled}
        className={`
          w-full py-3 px-4 rounded-lg font-semibold transition-all
          ${isDisabled 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'}
        `}
      >
        {isClaiming ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing claim...
          </span>
        ) : (
          'Claim Bounty'
        )}
      </button>

      {isPolling && (
        <p className="text-xs text-gray-400 text-center">
          🔄 Auto-refreshing status...
        </p>
      )}
    </div>
  );
}
