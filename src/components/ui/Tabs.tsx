"use client";

import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            active === tab.key
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span
              className={cn(
                "rounded-full px-1.5 text-xs",
                active === tab.key
                  ? "bg-slate-100 dark:bg-slate-700"
                  : "bg-slate-200/60 dark:bg-slate-800",
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
