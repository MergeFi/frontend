export type UserRole = "contributor" | "maintainer" | "sponsor";

// Mirrors mergefi-backend's BountyStatus enum (src/common/enums/index.ts)
export type BountyStatus =
  | "open"
  | "funded"
  | "claimed"
  | "in_review"
  | "merged"
  | "paid"
  | "refunded"
  | "expired";

// Mirrors mergefi-backend's BountyDifficulty enum
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export interface TeamSplit {
  role: string;
  percentage: number;
  contributor?: string;
}

export interface Bounty {
  id: string;
  repo: string;
  org: string;
  issueNumber: number;
  title: string;
  description: string;
  reward: number;
  rewardStr: string;
  asset: "USDC" | "XLM";
  difficulty: Difficulty;
  status: BountyStatus;
  deadline: string;
  labels: string[];
  claimedBy?: string;
  teamSplits?: TeamSplit[];
  milestoneId?: string;
  escrowId?: string;
}

export interface Milestone {
  id: string;
  name: string;
  repo: string;
  budget: number;
  distributed: number;
  budgetStr: string;
  distributedStr: string;
  asset: "USDC" | "XLM";
  issueCount: number;
  completedCount: number;
}

export interface ReputationProfile {
  handle: string;
  avatarUrl: string;
  lifetimeEarnings: number;
  mergedPRs: number;
  completionRate: number;
  avgReviewTimeHours: number;
  onTimeDeliveryRate: number;
  languages: string[];
  organizations: string[];
  topClients: string[];
}

export interface SponsorSummary {
  name: string;
  totalFunded: number;
  activeBounties: number;
  budgetRemaining: number;
  repos: string[];
}

export interface MaintenancePool {
  id: string;
  repo: string;
  monthlyDeposit: number;
  balance: number;
  monthlyDepositStr: string;
  balanceStr: string;
  asset: "USDC" | "XLM";
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  roles: UserRole[];
  stellarAddress: string | null;
}
