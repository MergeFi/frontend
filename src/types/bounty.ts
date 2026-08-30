export type BountyStatus = 
  | 'open' 
  | 'in-progress' 
  | 'claimed' 
  | 'completed' 
  | 'cancelled';

export interface Bounty {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: BountyStatus;
  claimedBy?: string;
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
  repository: string;
  issueNumber: number;
  maintainer?: string;
  assignee?: string;
}

export interface BountyStatusUpdate {
  bountyId: string;
  status: BountyStatus;
  claimedBy?: string;
  timestamp: string;
}

export interface ClaimResult {
  success: boolean;
  message?: string;
  bounty?: Bounty;
  error?: 'ALREADY_CLAIMED' | 'NETWORK_ERROR' | 'UNKNOWN';
}
