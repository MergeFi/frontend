import { cn } from "@/lib/utils";
import type { BountyStatus, Difficulty } from "@/types";

const statusStyles: Record<BountyStatus, string> = {
  open: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  claimed: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
  in_review: "bg-sky-500/10 text-sky-400 ring-sky-500/30",
  merged: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/30",
  paid: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  refunded: "bg-slate-500/10 text-slate-400 ring-slate-500/30",
  expired: "bg-rose-500/10 text-rose-400 ring-rose-500/30",
};

const difficultyStyles: Record<Difficulty, string> = {
  easy: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
  hard: "bg-rose-500/10 text-rose-400 ring-rose-500/30",
  expert: "bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/30",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: BountyStatus }) {
  return (
    <BaseBadge className={statusStyles[status]}>
      {status.replace("_", " ")}
    </BaseBadge>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <BaseBadge className={difficultyStyles[difficulty]}>{difficulty}</BaseBadge>;
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <BaseBadge className={cn("bg-slate-800 text-slate-300 ring-slate-700", className)}>
      {children}
    </BaseBadge>
  );
}
