import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-slate-900/60 p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-emerald-400" />}
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
