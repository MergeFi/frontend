import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
      </span>
      <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
