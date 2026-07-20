import type {
  Bounty,
  Milestone,
  MaintenancePool,
  TeamSplit,
  Difficulty,
  ReputationProfile,
} from "@/types";
import {
  coerceDecimal,
  coerceNonNegative,
  coercePercentage,
  validateTeamSplits,
} from "./utils";

// Shapes returned by mergefi-backend's TypeORM entities (see
// mergefi-backend/src/common/entities). These are intentionally loose since
// we only read the fields the UI needs.
interface RawRepository {
  owner: string;
  name: string;
}

interface RawUser {
  username: string;
}

interface RawTeamSplit {
  role: string | null;
  percentage: string;
  user?: RawUser | null;
}

interface RawIssue {
  number: number;
  title: string;
  body: string | null;
  labels: string[];
  repository?: RawRepository;
}

export interface RawBounty {
  id: string;
  amount: string;
  asset: "USDC" | "XLM";
  difficulty: Difficulty;
  status: Bounty["status"];
  deadline: string | null;
  escrowId: string | null;
  issue?: RawIssue;
  claimedBy?: RawUser | null;
  team?: { splits?: RawTeamSplit[] } | null;
}

export function adaptBounty(raw: RawBounty): Bounty & { teamSplitsValid?: { valid: boolean; sum: number; message?: string } } {
  const splits = raw.team?.splits?.map(
    (split): TeamSplit => ({
      role: split.role ?? "Contributor",
      percentage: coercePercentage(split.percentage),
      contributor: split.user?.username,
    }),
  );

  return {
    id: raw.id,
    repo: raw.issue?.repository?.name ?? "unknown-repo",
    org: raw.issue?.repository?.owner ?? "unknown-org",
    issueNumber: raw.issue?.number ?? 0,
    title: raw.issue?.title ?? "Untitled issue",
    description: raw.issue?.body ?? "",
    reward: coerceNonNegative(raw.amount),
    asset: raw.asset,
    difficulty: raw.difficulty,
    status: raw.status,
    deadline: raw.deadline ?? new Date().toISOString(),
    labels: raw.issue?.labels ?? [],
    claimedBy: raw.claimedBy?.username,
    escrowId: raw.escrowId ?? undefined,
    teamSplits: splits,
    teamSplitsValid: splits ? validateTeamSplits(splits) : undefined,
  };
}

export interface RawMilestone {
  id: string;
  title: string;
  budget: string;
  distributed: string;
  asset: "USDC" | "XLM";
  repository?: RawRepository;
  issues?: { state: "open" | "closed" }[];
}

export function adaptMilestone(raw: RawMilestone): Milestone {
  const issues = raw.issues ?? [];
  return {
    id: raw.id,
    name: raw.title,
    repo: raw.repository ? `${raw.repository.owner}/${raw.repository.name}` : "unassigned",
    budget: coerceNonNegative(raw.budget),
    distributed: coerceNonNegative(raw.distributed),
    asset: raw.asset,
    issueCount: issues.length,
    completedCount: issues.filter((i) => i.state === "closed").length,
  };
}

export interface RawMaintenancePool {
  id: string;
  monthlyDeposit: string;
  balance: string;
  asset: "USDC" | "XLM";
  repository?: RawRepository | null;
}

export function adaptMaintenancePool(raw: RawMaintenancePool): MaintenancePool {
  return {
    id: raw.id,
    repo: raw.repository ? `${raw.repository.owner}/${raw.repository.name}` : "platform-wide",
    monthlyDeposit: coerceNonNegative(raw.monthlyDeposit),
    balance: coerceNonNegative(raw.balance),
    asset: raw.asset,
  };
}

export interface RawReputationSnapshot {
  totalEarnings: string;
  mergedPrCount: number;
  completionRate: string;
  avgReviewTimeHours: string;
  onTimeDeliveryPercentage: string;
  languages: Record<string, number>;
  orgsContributedTo: string[];
}

export interface RawUserProfile {
  username: string;
  avatarUrl: string | null;
}

export function adaptReputation(
  user: RawUserProfile,
  snapshot: RawReputationSnapshot | null,
): ReputationProfile {
  return {
    handle: user.username,
    avatarUrl:
      user.avatarUrl ??
      `https://api.dicebear.com/9.x/identicon/svg?seed=${user.username}`,
    lifetimeEarnings: snapshot ? coerceNonNegative(snapshot.totalEarnings) : 0,
    mergedPRs: snapshot?.mergedPrCount ?? 0,
    completionRate: snapshot ? coerceDecimal(snapshot.completionRate) / 100 : 0,
    avgReviewTimeHours: snapshot ? coerceNonNegative(snapshot.avgReviewTimeHours) : 0,
    onTimeDeliveryRate: snapshot ? coerceDecimal(snapshot.onTimeDeliveryPercentage) / 100 : 0,
    languages: snapshot ? Object.keys(snapshot.languages) : [],
    organizations: snapshot?.orgsContributedTo ?? [],
    topClients: [],
  };
}
