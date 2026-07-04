import type {
  Bounty,
  Milestone,
  ReputationProfile,
  SponsorSummary,
  MaintenancePool,
} from "@/types";

export const mockBounties: Bounty[] = [
  {
    id: "b1",
    repo: "stellar-wallet-kit",
    org: "stellar-labs",
    issueNumber: 482,
    title: "Fix wallet reconnect race condition on network switch",
    description:
      "Switching between testnet and mainnet while a Freighter session is active can leave the app in a stale connection state. Needs a fix in the wallet provider's effect cleanup.",
    reward: 150,
    asset: "USDC",
    difficulty: "medium",
    status: "open",
    deadline: new Date(Date.now() + 6 * 86400000).toISOString(),
    labels: ["bug", "wallet", "good-first-issue"],
  },
  {
    id: "b2",
    repo: "soroban-escrow-sdk",
    org: "mergefi",
    issueNumber: 17,
    title: "Add milestone allocation validation to escrow client",
    description:
      "Client-side helper should reject milestone allocations that exceed the remaining pool budget before submitting the transaction.",
    reward: 220,
    asset: "USDC",
    difficulty: "medium",
    status: "claimed",
    deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    labels: ["sdk", "enhancement"],
    claimedBy: "0xkoda",
  },
  {
    id: "b3",
    repo: "docs-site",
    org: "mergefi",
    issueNumber: 9,
    title: "Document Soroban escrow contract API reference",
    description:
      "Write reference docs for fund/release/refund functions including auth requirements and error codes.",
    reward: 60,
    asset: "USDC",
    difficulty: "easy",
    status: "open",
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    labels: ["docs", "good-first-issue"],
  },
  {
    id: "b4",
    repo: "core-indexer",
    org: "stellar-labs",
    issueNumber: 301,
    title: "Optimize ledger ingestion batch size for large repos",
    description:
      "Current batching causes memory spikes on repos with >50k merged PRs. Needs profiling and a streaming rewrite.",
    reward: 480,
    asset: "USDC",
    difficulty: "hard",
    status: "in_review",
    deadline: new Date(Date.now() + 1 * 86400000).toISOString(),
    labels: ["performance", "backend"],
    claimedBy: "priyaeth",
    teamSplits: [
      { role: "Backend", percentage: 70, contributor: "priyaeth" },
      { role: "Testing", percentage: 30, contributor: "qa_marcus" },
    ],
  },
  {
    id: "b5",
    repo: "core-indexer",
    org: "stellar-labs",
    issueNumber: 288,
    title: "Upgrade dependency set for Node 22 compatibility",
    description: "Routine maintenance bounty funded from the recurring pool.",
    reward: 40,
    asset: "USDC",
    difficulty: "easy",
    status: "paid",
    deadline: new Date(Date.now() - 2 * 86400000).toISOString(),
    labels: ["maintenance"],
    claimedBy: "devrel_ana",
  },
];

export const mockMilestones: Milestone[] = [
  {
    id: "m1",
    name: "v2.0 — Multi-asset escrow",
    repo: "soroban-escrow-sdk",
    budget: 12000,
    distributed: 4300,
    asset: "USDC",
    issueCount: 12,
    completedCount: 4,
  },
  {
    id: "m2",
    name: "v1.4 — Indexer performance pass",
    repo: "core-indexer",
    budget: 6000,
    distributed: 2100,
    asset: "USDC",
    issueCount: 8,
    completedCount: 3,
  },
];

export const mockMaintenancePools: MaintenancePool[] = [
  {
    id: "p1",
    repo: "core-indexer",
    monthlyDeposit: 500,
    balance: 1240,
    asset: "USDC",
  },
];

export const mockReputationProfiles: Record<string, ReputationProfile> = {
  priyaeth: {
    handle: "priyaeth",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    lifetimeEarnings: 8420,
    mergedPRs: 61,
    completionRate: 0.94,
    avgReviewTimeHours: 14,
    onTimeDeliveryRate: 0.88,
    languages: ["Rust", "TypeScript", "Go"],
    organizations: ["stellar-labs", "mergefi"],
    topClients: ["stellar-labs", "openzeppelin"],
  },
  "0xkoda": {
    handle: "0xkoda",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    lifetimeEarnings: 3210,
    mergedPRs: 27,
    completionRate: 0.9,
    avgReviewTimeHours: 20,
    onTimeDeliveryRate: 0.81,
    languages: ["Rust", "Solidity"],
    organizations: ["mergefi"],
    topClients: ["mergefi"],
  },
};

export const mockSponsorSummary: SponsorSummary = {
  name: "Stellar Development Foundation",
  totalFunded: 42500,
  activeBounties: 9,
  budgetRemaining: 15800,
  repos: ["stellar-wallet-kit", "core-indexer", "soroban-escrow-sdk"],
};

export const platformStats = {
  totalPaidOut: 184230,
  bountiesCompleted: 612,
  activeContributors: 341,
  avgPayoutTimeMinutes: 4,
};
