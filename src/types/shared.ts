export type UserRole = "contributor" | "maintainer" | "sponsor";

// Mirrors mergefi-backend's BountyDifficulty enum
// `"unknown"` is the coerceDifficulty fallback for a value the frontend does
// not recognise (#893), rendered as such instead of silently dropped.
export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert" | "unknown";

export interface TeamSplit {
  role: string;
  percentage: number;
  contributor?: string;
}

export interface Milestone {
  id: string;
  name: string;
  repo: string;
  budget: number;
  distributed: number;
  asset: "USDC" | "XLM";
  status: string;
  deadline: string | null;
  issueCount: number;
  /**
   * Share of the budget paid out so far (`distributed / budget`, 0 when
   * unfunded). Not a count of completed issues: that can only come from the
   * backend, so it is not derived here (#894).
   */
  distributedFraction: number;
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
  /**
   * Whether this contributor has opted into search-engine indexing of their
   * profile page. Defaults to false — see src/lib/seo-policy.ts for the policy
   * and the backend field this maps to.
   */
  indexable?: boolean;
}

export interface MaintenancePool {
  id: string;
  name: string | null;
  repo: string;
  monthlyDeposit: number;
  balance: number;
  asset: "USDC" | "XLM";
  status: string;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  roles: UserRole[];
  stellarAddress: string | null;
}
