import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Users,
  BarChart3,
  GitPullRequest,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { platformStats } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const journey = [
  "Maintainer connects a GitHub repository.",
  "Issue #42 is marked with a 100 USDC reward.",
  "A sponsor funds the bounty — funds lock into a Soroban escrow contract.",
  "A contributor claims the issue and opens a pull request.",
  "The maintainer reviews and merges it.",
  "MergeFi detects the merge via GitHub webhook.",
  "The escrow contract automatically releases payment to the contributor.",
  "The contributor's reputation and earnings profile update instantly.",
];

const features = [
  {
    icon: GitPullRequest,
    title: "Repository sync",
    description:
      "Connect GitHub and MergeFi imports repositories, issues, pull requests, and contributors automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Smart escrow",
    description:
      "Funds move into a Soroban smart contract the moment a bounty is funded — no one can withdraw until the work is verified.",
  },
  {
    icon: Zap,
    title: "Instant payouts",
    description:
      "Merges are detected via GitHub webhooks and trigger automatic on-chain payment release in seconds.",
  },
  {
    icon: Users,
    title: "Team bounties",
    description:
      "Split rewards across multiple contributors by role — frontend, backend, testing — paid out automatically.",
  },
  {
    icon: BarChart3,
    title: "Reputation & analytics",
    description:
      "Build a financial contribution profile: lifetime earnings, merge rate, review time, and top clients.",
  },
  {
    icon: Wallet,
    title: "Sponsor dashboards",
    description:
      "Track spending, active bounties, contributor performance, and budget remaining in real time.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <section className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">
          Where open source meets finance
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">
          Merge code. Earn instantly.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          MergeFi is the financial infrastructure for open source — sponsors
          fund issues, contributors get paid the moment their pull request is
          merged, and Soroban smart contracts on Stellar handle the escrow.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/issues">
            <Button size="lg">Browse paid issues</Button>
          </Link>
          <Link href="/connect">
            <Button size="lg" variant="outline">
              Sponsor a repository
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total paid out"
          value={formatCurrency(platformStats.totalPaidOut)}
        />
        <StatCard
          label="Bounties completed"
          value={platformStats.bountiesCompleted.toLocaleString()}
        />
        <StatCard
          label="Active contributors"
          value={platformStats.activeContributors.toLocaleString()}
        />
        <StatCard
          label="Avg. payout time"
          value={`${platformStats.avgPayoutTimeMinutes} min`}
        />
      </section>

      <section className="mt-24">
        <h2 className="text-center text-2xl font-semibold text-white">
          Everything you need to fund and get paid for open source
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <Icon className="h-6 w-6 text-emerald-400" />
              <h3 className="mt-4 font-medium text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
        <h2 className="text-2xl font-semibold text-white">
          A typical bounty, start to finish
        </h2>
        <ol className="mt-8 space-y-4">
          {journey.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                {i + 1}
              </span>
              <p className="pt-0.5 text-slate-300">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-24 text-center">
        <h2 className="text-2xl font-semibold text-white">
          Why Stellar and Soroban?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          Very low transaction costs make micro-bounties practical, fast
          settlement means contributors aren&apos;t waiting days for payment,
          and Soroban smart contracts handle escrow, splits, and milestone
          payouts natively on-chain.
        </p>
      </section>
    </div>
  );
}
