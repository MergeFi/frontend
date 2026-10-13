"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  SORT_LABELS,
  SORT_VALUES,
  DIFFICULTY_VALUES,
  ASSET_VALUES,
  type BountyQuery,
} from "@/lib/bounty-query";

/** The sentinel "no filter" value for each select, by field name. */
const DEFAULT_SELECT_VALUES: Record<string, string> = {
  difficulty: "all",
  asset: "all",
  sort: "default",
};

interface IssuesFilterFormProps {
  query: BountyQuery;
  filterActive: boolean;
  difficultyLabels: Record<(typeof DIFFICULTY_VALUES)[number], string>;
  assetLabels: Record<(typeof ASSET_VALUES)[number], string>;
}

/**
 * A plain GET form so every filter combination stays a shareable,
 * bookmarkable URL and the page works with JavaScript disabled (#28).
 *
 * When JS *is* available, `handleSubmit` disables any field still at its
 * default/empty value right before the browser serializes the form —
 * disabled fields aren't included in a submission, so the resulting URL
 * matches the canonical one `buildIssuesHref` produces instead of spelling
 * out every default explicitly as `?difficulty=all&asset=all&...` (#701).
 * Without JS this handler never runs and the form still works exactly as
 * before, just with a noisier URL.
 */
export function IssuesFilterForm({
  query,
  filterActive,
  difficultyLabels,
  assetLabels,
}: IssuesFilterFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    for (const element of Array.from(form.elements)) {
      if (element instanceof HTMLSelectElement) {
        if (element.value === DEFAULT_SELECT_VALUES[element.name]) {
          element.disabled = true;
        }
      } else if (element instanceof HTMLInputElement && element.type === "number") {
        if (element.value === "") {
          element.disabled = true;
        }
      }
    }
  }

  return (
    <form
      method="get"
      action="/issues"
      onSubmit={handleSubmit}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40"
    >
      {query.status !== "all" && <input type="hidden" name="status" value={query.status} />}

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        Difficulty
        <select
          name="difficulty"
          defaultValue={query.difficulty}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          {DIFFICULTY_VALUES.map((value) => (
            <option key={value} value={value}>
              {difficultyLabels[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        Asset
        <select
          name="asset"
          defaultValue={query.asset}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          {ASSET_VALUES.map((value) => (
            <option key={value} value={value}>
              {assetLabels[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        Min reward
        <input
          type="number"
          inputMode="decimal"
          min={0}
          name="minReward"
          defaultValue={query.minReward ?? ""}
          placeholder="0"
          className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        Max reward
        <input
          type="number"
          inputMode="decimal"
          min={0}
          name="maxReward"
          defaultValue={query.maxReward ?? ""}
          placeholder="Any"
          className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        Sort by
        <select
          name="sort"
          defaultValue={query.sort}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          {SORT_VALUES.map((value) => (
            <option key={value} value={value}>
              {SORT_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" size="sm">
        Apply filters
      </Button>
      {filterActive && (
        <Link
          href="/issues"
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Clear all
        </Link>
      )}
    </form>
  );
}
