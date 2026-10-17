/**
 * messages.ts — single source of truth for user-facing English copy that the
 * state-sensitive surfaces depend on.
 *
 * WHY THIS EXISTS
 * ───────────────
 * This app has no translation runtime, so these strings are still English
 * literals. What changed is that they are no longer *scattered* — every
 * string whose value depends on auth/role/wallet/empty state is keyed here
 * next to its siblings, so a future extractor has one file to walk and a
 * future `next-intl` migration is a mechanical `t("key")` swap rather than a
 * rewrite of 80 components.
 *
 * The shape is a flat `Record<string, string>` with typed keys. A real
 * catalog would nest by namespace and carry ICU placeholders; the flat shape
 * is deliberate so adding a locale means adding one sibling object, not
 * restructuring every call site.
 *
 * NOT IN SCOPE: actually translating these. Shipping a second language needs
 * a product decision about which languages, and a half-done translation
 * surface is worse than none.
 */

/** English copy, keyed by a stable dotted id. */
export const messages = {
  // ─── Navigation ───────────────────────────────────────────────────────
  "nav.bounties": "Bounties",
  "nav.milestones": "Milestones",
  "nav.dashboards": "Dashboards",
  "nav.reputation": "Reputation",
  "nav.signIn": "Sign in",
  "nav.connectGitHub": "Connect GitHub",
  "nav.signOut": "Sign out",
  "nav.resolvingSession": "Restoring your session",
  "nav.wallet.connected": "Wallet connected",
  "nav.wallet.notLinked": "Wallet not linked to your account",
  "nav.wallet.needsGitHub": "Link a wallet",
  "nav.roles.none": "No dashboard assigned yet",
  "nav.roles.multiLabel": "You have {count} roles — pick a dashboard",
  "nav.role.contributor": "Contributor",
  "nav.role.maintainer": "Maintainer",
  "nav.role.sponsor": "Sponsor",

  // ─── Connect flow ─────────────────────────────────────────────────────
  "connect.eyebrow": "Get started",
  "connect.title": "Connect your accounts",
  "connect.intro":
    "MergeFi needs GitHub to sync your repositories and a Stellar wallet to send or receive bounty payments.",
  "connect.github.name": "GitHub",
  "connect.github.description": "Sync repositories, issues, and pull requests.",
  "connect.github.cta": "Continue with GitHub",
  "connect.github.signedIn": "Signed in as @{username}",
  "connect.github.checking": "Checking your GitHub session…",
  "connect.wallet.name": "Stellar wallet",
  "connect.wallet.description": "Freighter is used to sign escrow and payout transactions.",
  "connect.wallet.cta": "Connect Freighter",
  "connect.wallet.connecting": "Connecting…",
  "connect.wallet.checking": "Checking your wallet…",
  "connect.wallet.linked": "Payout wallet: {address} ({network})",
  "connect.wallet.localOnlyTitle": "Connected, but not linked to your account",
  "connect.wallet.localOnlyBody":
    "Freighter granted access, but this address was never saved to your MergeFi profile, so payouts cannot reach it. Link it before you fund or claim a bounty.",
  "connect.wallet.blockedTitle": "Sign in with GitHub first",
  "connect.wallet.blockedBody":
    "A wallet has to be linked to a MergeFi account, so link your wallet after GitHub sign-in. This keeps the payout address on your profile and stops a connection from being lost when you sign in.",
  "connect.wallet.mismatchTitle": "Wallet address mismatch",
  "connect.wallet.mismatchBody":
    "The connected wallet ({address}) differs from the payout address on file ({onFile}). Payouts are sent to the address on file until you reconnect.",
  "connect.wallet.relinkTitle": "Replace your payout wallet?",
  "connect.wallet.relinkBody":
    "Freighter is now using {address}, but your payout address on file is {onFile}. Replacing it redirects all future payouts and requires you to sign an ownership proof with the new wallet. Nothing changes unless you confirm.",
  "connect.wallet.relinkConfirm": "Sign and replace wallet",
  "connect.wallet.relinkCancel": "Keep current wallet",
  "connect.wallet.disconnect": "Disconnect wallet",
  "connect.completeTitle": "You're connected",
  "connect.completeBody": "GitHub and your payout wallet are both linked. You're ready to fund or claim bounties.",
  "connect.progressLabel": "Connection checklist",
  "connect.step.github": "GitHub account",
  "connect.step.wallet": "Payout wallet",
  "connect.step.done": "Done",
  "connect.step.pending": "Not connected",
  "connect.step.needsLinking": "Connected in browser, not linked to your account",

  // ─── Empty states ─────────────────────────────────────────────────────
  "empty.issues.none.title": "No bounties yet",
  "empty.issues.none.description":
    "Check back soon — funded issues appear here once sponsors lock them in escrow.",
  "empty.issues.none.cta": "Fund a bounty",
  "empty.issues.filtered.title": "No bounties match these filters",
  "empty.issues.filtered.description":
    "Every bounty is hidden by the filters you have active. Clear them to see all {total} available.",
  "empty.issues.filtered.cta": "Clear filters",
  "empty.milestones.none.title": "No milestones yet",
  "empty.milestones.none.description":
    "Milestones fund a whole release at once. Sponsors create them once a batch of issues shares a target.",
  "empty.milestones.none.cta": "Fund a milestone",
  "empty.pools.none.title": "No maintenance pools yet",
  "empty.pools.none.description":
    "Maintenance pools pay for ongoing upkeep — dependency bumps, docs, cleanup — that would otherwise go unfunded between releases.",
  "empty.pools.none.cta": "Set up a pool",
  "empty.review.clear.title": "All caught up",
  "empty.review.clear.description":
    "No pull requests are waiting on your review. Everything you've been sent has been merged or paid out.",
  "empty.review.clear.cta": "Review open bounties",
  "empty.sponsor.none.title": "No active bounties",
  "empty.sponsor.none.description":
    "Fund your first bounty to see it here — it's live for contributors the moment the escrow locks.",
  "empty.sponsor.none.cta": "Fund a bounty",
  "empty.sponsor.settled.title": "Every bounty settled",
  "empty.sponsor.settled.description":
    "Nothing is in flight — all the bounties you've funded have been paid out or refunded. Fund another whenever you're ready.",
  "empty.claims.active.title": "No active claims",
  "empty.claims.active.description":
    "You're not working on anything right now. Claim an open bounty to start earning.",
  "empty.claims.active.cta": "Browse open bounties",
  "empty.claims.completed.title": "Nothing completed yet",
  "empty.claims.completed.description":
    "Bounties land here once your pull request is merged and escrow releases the payout.",
  "empty.claims.completed.cta": "Browse open bounties",
  "empty.activity.title": "No activity yet",
  "empty.activity.description":
    "Claims, reviews, and payouts across the platform will show up here as they happen.",
  "empty.reputation.zero.title": "No merged pull requests yet",
  "empty.reputation.zero.description":
    "This profile has no contribution history. A single merged bounty claim is enough to start building a reputation.",
  "empty.reputation.zero.cta": "Browse open bounties",
  "empty.reputation.noOrgs": "No organizations recorded yet.",
  "empty.reputation.noLanguages": "No languages recorded yet.",

  // ─── Data provenance ──────────────────────────────────────────────────
  "data.sample": "Sample data",
  "data.sampleExplainer":
    "Showing sample data because the MergeFi API is unreachable. Figures below are illustrative, not yours.",

  // ─── Deadlines ────────────────────────────────────────────────────────
  "deadline.none": "No deadline",
  "deadline.passed": "Deadline passed",
  "deadline.left": "{count, plural, one {# day} other {# days}} left",

  // ─── Issue detail (#673) ──────────────────────────────────────────────
  "issue.detail.notFoundTitle": "Issue not found | MergeFi",
  "issue.detail.fallbackDescription": "Fund or claim this bounty on MergeFi.",
  "issue.detail.escrowStatus": "Escrow status",
  "issue.detail.deadline": "Deadline",
  "issue.detail.claimedBy": "Claimed by",
  "issue.detail.unclaimed": "Unclaimed",
  "issue.detail.milestone": "Milestone",
  "issue.detail.partOfFundedMilestone": "Part of a funded milestone",
  "issue.detail.teamPayoutSplit": "Team payout split",
  "issue.detail.splitMismatchTitle": "This payout split doesn't add up",
  "issue.detail.splitMismatchAdvice":
    "the listed shares don't cover the full reward, so don't rely on them until the team's split has been corrected.",
  "issue.detail.splitSumFallback": "Team splits sum to {sum}% (expected 100%)",

  // ─── Issue actions (#670) ────────────────────────────────────────────
  "issue.actions.fund": "Fund this bounty",
  "issue.actions.submitting": "Submitting...",
  "issue.actions.awaitingFunding": "Awaiting sponsor funding",
  "issue.actions.fundedNotice":
    "Escrow funded on-chain. This bounty is now open for claims.",
  "issue.actions.connectWallet": "Connect a Stellar wallet to continue.",
  "issue.actions.claimedNotice":
    "You've claimed this issue. Open a pull request to get started.",
  "issue.actions.refundConfirm":
    "Are you sure you want to refund this bounty? This will return {amount} to the sponsor and cannot be undone.",
  "issue.actions.refundedNotice": "Escrowed funds were refunded to the sponsor.",
  "issue.actions.refund": "Refund sponsor",
  "issue.actions.refundDeadline": "Refund sponsor (deadline passed)",
  "issue.actions.payoutComplete": "Payout complete",
  "issue.actions.awaitingMerge": "Awaiting PR merge",
  "issue.actions.payoutPending": "Payout pending",
  "issue.actions.payoutFailed": "Payout failed — contact support",
  "issue.actions.noAction": "No action available",
  "issue.actions.deadlinePassed": "Deadline passed",
  "issue.actions.genericError": "Something went wrong.",
  "issue.actions.webhookNote":
    "Funding and claiming write to the live mergefi-backend API. Merge detection and payout release happen automatically via GitHub webhooks once a linked pull request is merged.",

  // ─── Milestones & pools (#671) ───────────────────────────────────────
  "milestone.fund.amountExceedsBudget": "Amount exceeds the remaining {budget} budget.",
  "milestone.fund.amountLabel": "Funding amount",
  "milestone.fund.remainingBudget": "Remaining budget: {budget}.",
  "milestone.fund.invalidAmount": "Invalid amount.",
  "milestone.fund.connectWallet": "Connect a Stellar wallet to fund this milestone.",
  "milestone.fund.fundedNotice":
    "Milestone funded successfully. The funds are now locked in escrow.",
  "milestone.fund.confirming": "Confirming in wallet...",
  "milestone.fund.button": "Fund milestone",
  "milestone.fund.buttonNamed": "Fund milestone: {name}",
  "pool.deposit.amountLabel": "Deposit amount",
  "pool.deposit.connectWallet": "Connect a Stellar wallet to deposit.",
  "pool.deposit.confirming": "Confirming...",
  "pool.deposit.button": "Deposit",
  "pool.deposit.aria": "Deposit to pool",
  "pool.deposit.buttonNamed": "Deposit to pool: {repo}",
  "pool.deposit.success": "Deposit successful.",
  "milestone.create.button": "Create milestone",
  "milestone.create.title": "Create milestone",
  "milestone.create.repoPlaceholder": "owner/repo",
  "milestone.create.namePlaceholder": "Milestone name",
  "milestone.create.failed": "Failed to create milestone",
  "milestone.create.creating": "Creating…",
  "milestone.create.confirm": "Create",
  "milestone.create.cancel": "Cancel",
  "milestone.attach.button": "Attach issue",
  "milestone.attach.title": "Attach issue to milestone",
  "milestone.attach.placeholder": "issue-id",
  "milestone.attach.failed": "Failed to attach issue",
  "milestone.attach.attaching": "Attaching…",
  "milestone.attach.confirm": "Attach",
  "milestone.attach.cancel": "Cancel",
  "milestone.resolve.resolving": "Resolving…",
  "milestone.resolve.button": "Resolve & pay",
  "milestone.resolve.failed": "Failed to resolve issue",

  // ─── Home page (#672) ────────────────────────────────────────────────
  "home.network.mainnet": "Built for Stellar Mainnet",
  "home.network.testnet": "Built for Stellar (Testnet)",
  "home.hero.headline": "Merge code.",
  "home.hero.headlineAccent": "Earn instantly.",
  "home.hero.subtitle":
    "MergeFi is the financial infrastructure for open source. Sponsors fund issues, contributors get paid the moment their pull request is merged, and Soroban smart contracts on Stellar handle the escrow.",
  "home.hero.browseCta": "Browse paid issues",
  "home.hero.sponsorCta": "Sponsor a repository",
  "home.hero.joinedBy": "Joined by {count} contributors already earning",
  "home.trustedBy": "Trusted by open-source teams on Stellar",
  "home.stats.totalPaidOut": "Total paid out",
  "home.stats.bountiesCompleted": "Bounties completed",
  "home.stats.activeContributors": "Active contributors",
  "home.stats.avgPayoutTime": "Avg. payout time",
  "home.stats.avgPayoutValue": "{minutes} min",
  "home.features.kicker": "Platform",
  "home.features.heading": "Everything you need to fund and get paid for open source",
  "home.feature.repoSync.title": "Repository sync",
  "home.feature.repoSync.description":
    "Connect GitHub and MergeFi imports repositories, issues, pull requests, and contributors automatically.",
  "home.feature.smartEscrow.title": "Smart escrow",
  "home.feature.smartEscrow.description":
    "Funds move into a Soroban smart contract the moment a bounty is funded. No one can withdraw until the work is verified.",
  "home.feature.instantPayouts.title": "Instant payouts",
  "home.feature.instantPayouts.description":
    "Merges are detected via GitHub webhooks and trigger automatic on-chain payment release in seconds.",
  "home.feature.teamBounties.title": "Team bounties",
  "home.feature.teamBounties.description":
    "Split rewards across multiple contributors by role, like frontend, backend, and testing, paid out automatically.",
  "home.feature.reputation.title": "Reputation & analytics",
  "home.feature.reputation.description":
    "Build a financial contribution profile: lifetime earnings, merge rate, review time, and top clients.",
  "home.feature.sponsorDashboards.title": "Sponsor dashboards",
  "home.feature.sponsorDashboards.description":
    "Track spending, active bounties, contributor performance, and budget remaining in real time.",
  "home.journey.heading": "A typical bounty, start to finish",
  "home.journey.step1": "Maintainer connects a GitHub repository.",
  "home.journey.step2": "Issue #42 is marked with a 100 USDC reward.",
  "home.journey.step3": "A sponsor funds the bounty, and funds lock into a Soroban escrow contract.",
  "home.journey.step4": "A contributor claims the issue and opens a pull request.",
  "home.journey.step5": "The maintainer reviews and merges it.",
  "home.journey.step6": "MergeFi detects the merge via GitHub webhook.",
  "home.journey.step7": "The escrow contract automatically releases payment to the contributor.",
  "home.journey.step8": "The contributor's reputation and earnings profile update instantly.",
  "home.topContributors.heading": "Top contributors this month",
  "home.topContributors.mergedPrs": "{count} merged PRs · {language}",
  "home.live.heading": "Live on the platform",
  "home.faq.kicker": "FAQ",
  "home.faq.heading": "Common questions",
  "home.stellar.heading": "Why Stellar and Soroban?",
  "home.stellar.body":
    "Very low transaction costs make micro-bounties practical, fast settlement means contributors aren't waiting days for payment, and Soroban smart contracts handle escrow, splits, and milestone payouts natively on-chain.",
  "home.stellar.cta": "Get started",

  // ─── Escrow status labels (#673) ─────────────────────────────────────
  "escrow.status.open": "Awaiting funding",
  "escrow.status.funded": "Funds locked",
  "escrow.status.claimed": "Funds locked",
  "escrow.status.in_review": "Funds locked",
  "escrow.status.merged": "Funds locked",
  "escrow.status.release_failed": "Payout failed — funds still locked",
  "escrow.status.paid": "Paid out",
  "escrow.status.refunded": "Refunded to sponsor",
  "escrow.status.expired": "Expired, unclaimed",
  "escrow.status.unknown": "Status unavailable",
} as const;

/** Every message key, as a union — used to keep `t()` calls honest. */
export type MessageKey = keyof typeof messages;

/**
 * Resolve the plural category for a count in the given locale.
 *
 * `formatDaysUntil` used to hardcode `days === 1 ? "" : "s"`, which is only
 * correct for English — Slovak has four plural categories and Arabic has six.
 * This reads the category from `Intl.PluralRules` so the message template
 * branches correctly the moment a non-English catalog exists.
 */
export function pluralCategory(count: number, locale: string): Intl.LDMLPluralRule {
  try {
    return new Intl.PluralRules(locale).select(count);
  } catch {
    return count === 1 ? "one" : "other";
  }
}

/**
 * Substituted into a plural branch: `{name}` becomes the value, and the ICU
 * `#` shorthand becomes the count itself (so templates stay translatable
 * into languages with a different digit shape).
 */
function fillBranch(branch: string, values: Record<string, string | number>, count: number): string {
  return branch
    .replace(/#/g, String(count))
    .replace(/\{(\w+)\}/g, (match, key: string) =>
      key in values ? String(values[key]) : match,
    );
}

// Matches the opening of a plural block. Deliberately non-global: this regex
// carries no `lastIndex` state across calls, and there is at most one plural
// block per message. No trailing lookahead — the branch list starts with a
// selector keyword (`one`, `other`, `=0`), not with a brace.
const PLURAL_HEADER = /\{(\w+),\s*plural,\s*/;

/** Where the plural block's branch list starts, and where the block ends. */
function findPluralBlock(
  template: string,
): { start: number; bodyStart: number; end: number } | null {
  const header = PLURAL_HEADER.exec(template);
  if (!header) return null;
  const bodyStart = header.index + header[0].length;

  // Balanced-brace walk rather than a regex: a lookahead heuristic for the
  // block's closing brace mis-nests whenever a branch itself contains braces,
  // silently truncating the final branch and leaking a stray "}" into the
  // output. Counting depth cannot mis-nest.
  let depth = 1;
  let i = bodyStart;
  while (i < template.length) {
    const ch = template[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  if (depth !== 0) return null; // Unbalanced template — treat as plain text.
  return { start: header.index, bodyStart, end: i };
}

/**
 * Resolve a message by key: substitutes `{placeholder}` values and evaluates
 * an ICU `plural` block against the viewer's locale. Typed, so a renamed or
 * deleted key is a compile error rather than a runtime "…".
 */
export function t(
  key: MessageKey,
  values: Record<string, string | number> = {},
  locale = "en",
): string {
  const template: string = messages[key];
  const block = findPluralBlock(template);
  if (!block) {
    return fillBranch(template, values, Number(values.count ?? 0));
  }

  const counterName = /^\{(\w+),/.exec(template.slice(block.start))?.[1];
  const count = counterName ? Number(values[counterName] ?? 0) : 0;
  const branches = parsePluralBranches(template.slice(block.bodyStart, block.end));

  // `=N` exact matches win over category matches, per the ICU spec.
  let branch = branches.get(`=${count}`);
  if (branch === undefined) {
    const category = pluralCategory(count, locale);
    branch =
      branches.get(`=${category}`) ?? branches.get(category) ?? branches.get("other") ?? "";
  }

  // Text outside the plural block is real copy and must survive — the
  // "{count, plural, …} left" shape has a meaningful suffix.
  return fillBranch(
    template.slice(0, block.start) + branch + template.slice(block.end + 1),
    values,
    count,
  );
}

/**
 * Parse `one {…} other {…}` pairs out of a plural branch list, brace-counting
 * so a nested block inside a branch is kept intact.
 */
function parsePluralBranches(body: string): Map<string, string> {
  const branches = new Map<string, string>();
  const pattern = /(=\d+|\w+)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    const selector = match[1];
    const start = pattern.lastIndex;
    let depth = 1;
    let i = start;
    while (i < body.length) {
      const ch = body[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }
    // `i` is the index of the matching close brace, or body.length when the
    // body is malformed — in which case we take the remainder.
    const end = depth === 0 ? i : body.length;
    branches.set(selector ?? "", body.slice(start, end));
    pattern.lastIndex = end + 1;
  }
  return branches;
}
