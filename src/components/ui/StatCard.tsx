import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sparkline } from "./Sparkline";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: number;
  sparkline?: number[];
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  sparkline,
  className,
}: StatCardProps) {
  const trendUp = typeof trend === "number" && trend >= 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
            <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
          {typeof trend === "number" && (
            <p
              className={cn(
                "mt-1 flex items-center gap-0.5 text-xs font-medium",
                trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
              )}
            >
              {trendUp ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        {sparkline && (
          <div className="text-indigo-500 dark:text-indigo-400">
            <Sparkline data={sparkline} />
          </div>
        )}
      </div>
    </div>
  );
}
