export type UserRole = "contributor" | "maintainer" | "sponsor";

export type BountyStatus =
  | "open"
  | "claimed"
  | "in_review"
  | "merged"
  | "paid"
  | "refunded"
  | "expired";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

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
  asset: "USDC" | "XLM";
  difficulty: Difficulty;
  status: BountyStatus;
  deadline: string;
  labels: string[];
  claimedBy?: string;
  teamSplits?: TeamSplit[];
  milestoneId?: string;
}

export interface Milestone {
  id: string;
  name: string;
  repo: string;
  budget: number;
  distributed: number;
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
  asset: "USDC" | "XLM";
}
