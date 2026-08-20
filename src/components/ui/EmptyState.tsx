import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "default" | "success" | "filtered" | "error";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  /** Visual variant for contextual empty states. */
  variant?: EmptyStateVariant;
}

const variantStyles: Record<EmptyStateVariant, { container: string; icon: string; title: string }> = {
  default: {
    container: "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40",
    icon: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
    title: "text-slate-700 dark:text-slate-200",
  },
  success: {
    container: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
    title: "text-emerald-900 dark:text-emerald-100",
  },
  filtered: {
    container: "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-100",
  },
  error: {
    container: "border-rose-200 bg-rose-50/50 dark:border-rose-800/50 dark:bg-rose-950/20",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400",
    title: "text-rose-900 dark:text-rose-100",
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center",
        styles.container,
      )}
    >
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", styles.icon)}>
        <Icon className="h-5 w-5" />
      </span>
      <p className={cn("mt-3 font-medium", styles.title)}>{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
