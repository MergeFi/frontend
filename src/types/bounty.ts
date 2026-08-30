export type BountyStatus =
  | 'open'
  | 'funded'
  | 'claimed'
  | 'in_review'
  | 'merged'
  | 'paid'
  | 'refunded'
  | 'expired';

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  asset: "USDC" | "XLM";
  difficulty: string;
  status: BountyStatus;
  org: string;
  repo: string;
  issueNumber: number;
  labels: string[];
  deadline: string | null;
  claimedBy?: string;
  claimedById?: string;
  milestoneId?: string;
  escrowId?: string;
  teamSplits?: { role: string; percentage: number; contributor?: string }[];
  teamSplitsValid?: { valid: boolean; sum: number; message?: string };
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
