import { cn } from "@/lib/utils";
import type { BountyStatus, Difficulty } from "@/types";
import {
  CircleDollarSign,
  Clock,
  CheckCircle2,
  Eye,
  GitMerge,
  Banknote,
  RotateCcw,
  TimerOff,
  Sprout,
  Shovel,
  Pickaxe,
  Crown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Badge encoding strategy (Issue #49):
 * - Color alone is insufficient for 8 status + 4 difficulty states, especially
 *   under color vision deficiency (protanopia/deuteranopia/tritanopia).
 * - Each state now pairs a unique icon with a distinct color hue.
 * - "funded" vs "paid" confusion resolved: funded uses sky-blue + DollarSign
 *   (money escrowed), paid uses emerald-green + Banknote (money released).
 * - All text/bg combinations target WCAG AA contrast in both light and dark mode.
 * - Icons provide non-color-dependent distinguishability for all 12 states.
 */

interface BadgeStyle {
  className: string;
  icon: LucideIcon;
}

const statusStyles: Record<BountyStatus, BadgeStyle> = {
  open: {
    className:
      "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600",
    icon: Clock,
  },
  funded: {
    className:
      "bg-sky-50 text-sky-800 ring-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/40",
    icon: CircleDollarSign,
  },
  claimed: {
    className:
      "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/40",
    icon: CheckCircle2,
  },
  in_review: {
    className:
      "bg-indigo-50 text-indigo-800 ring-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/40",
    icon: Eye,
  },
  merged: {
    className:
      "bg-violet-50 text-violet-800 ring-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/40",
    icon: GitMerge,
  },
  paid: {
    className:
      "bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/40",
    icon: Banknote,
  },
  refunded: {
    className:
      "bg-orange-50 text-orange-800 ring-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/40",
    icon: RotateCcw,
  },
  expired: {
    className:
      "bg-rose-50 text-rose-800 ring-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/40",
    icon: TimerOff,
  },
};

const difficultyStyles: Record<Difficulty, BadgeStyle> = {
  beginner: {
    className:
      "bg-teal-50 text-teal-800 ring-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-500/40",
    icon: Sprout,
  },
  intermediate: {
    className:
      "bg-blue-50 text-blue-800 ring-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/40",
    icon: Shovel,
  },
  advanced: {
    className:
      "bg-rose-50 text-rose-800 ring-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/40",
    icon: Pickaxe,
  },
  expert: {
    className:
      "bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-300 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:ring-fuchsia-500/40",
    icon: Crown,
  },
};

function BaseBadge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: BountyStatus }) {
  const style = statusStyles[status];
  const Icon = style.icon;
  return (
    <BaseBadge className={style.className}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{status.replace("_", " ")}</span>
    </BaseBadge>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const style = difficultyStyles[difficulty];
  const Icon = style.icon;
  return (
    <BaseBadge className={style.className}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{difficulty}</span>
    </BaseBadge>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseBadge
      className={cn(
        "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
        className,
      )}
    >
      {children}
    </BaseBadge>
  );
}
