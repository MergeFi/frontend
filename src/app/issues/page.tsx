import Link from "next/link";
import { fetchBounties, type BountyFilters } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";
import { BountyCard } from "@/components/bounty/BountyCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchX } from "lucide-react";

export const metadata = {
  title: "Paid Issues | MergeFi",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "funded", label: "Funded" },
  { value: "claimed", label: "Claimed" },
  { value: "in_review", label: "In Review" },
  { value: "paid", label: "Paid" },
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "reward_desc", label: "Highest reward" },
  { value: "reward_asc", label: "Lowest reward" },
  { value: "deadline_asc", label: "Soonest deadline" },
  { value: "deadline_desc", label: "Latest deadline" },
];

const PAGE_SIZE = 12;

function parseFilters(searchParams: URLSearchParams): BountyFilters {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const status = searchParams.get("status") ?? undefined;
  const difficulty = searchParams.get("difficulty") ?? undefined;
  const asset = searchParams.get("asset") ?? undefined;
  const sort = (searchParams.get("sort") as BountyFilters["sort"]) ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  return { page, pageSize: PAGE_SIZE, status, difficulty, asset, sort, search };
}

function buildFilterUrl(current: URLSearchParams, updates: Record<string, string | undefined>): string {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  // Reset to page 1 when filters change (unless explicitly setting page)
  if (!("page" in updates)) {
    next.delete("page");
  }
  const qs = next.toString();
  return `/issues${qs ? `?${qs}` : ""}`;
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<URLSearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const result = await fetchBounties(mockBounties, filters);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  // Clamp invalid page numbers
  const currentPage = Math.min(Math.max(1, filters.page ?? 1), totalPages);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Bounties
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Paid issues
        </h1>
        <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
          Every bounty below is backed by funds already locked in a Soroban
          escrow contract. Claim one, open a pull request, and get paid the
          moment it&apos;s merged.
        </p>
      </div>

      {/* Filter bar — all links update URL for shareability */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = (filters.status ?? "") === opt.value;
              const href = buildFilterUrl(sp, { status: opt.value || undefined });
              return (
                <Link
                  key={opt.value}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Difficulty filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Difficulty</label>
          <div className="flex flex-wrap gap-1">
            {DIFFICULTY_OPTIONS.map((opt) => {
              const isActive = (filters.difficulty ?? "") === opt.value;
              const href = buildFilterUrl(sp, { difficulty: opt.value || undefined });
              return (
                <Link
                  key={opt.value}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Sort</label>
          <div className="flex flex-wrap gap-1">
            {SORT_OPTIONS.map((opt) => {
              const isActive = (filters.sort ?? "") === opt.value;
              const href = buildFilterUrl(sp, { sort: opt.value || undefined });
              return (
                <Link
                  key={opt.value}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Result count */}
        <div className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {result.total} {result.total === 1 ? "bounty" : "bounties"}
        </div>
      </div>

      {/* Results */}
      {result.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No bounties match your filters"
          description="Try adjusting the status, difficulty, or sort criteria above."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {result.items.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={buildFilterUrl(sp, { page: String(currentPage - 1) })}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Previous
                </Link>
              )}
              <span className="px-3 text-sm text-slate-500 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={buildFilterUrl(sp, { page: String(currentPage + 1) })}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
