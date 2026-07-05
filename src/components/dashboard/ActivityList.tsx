import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/mock-data";

function timeAgo(minutes: number) {
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityList({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {events.map((event) => (
        <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar seed={event.handle} size={32} />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-900 dark:text-white">{event.handle}</span>{" "}
              {event.action}{" "}
              <span className="font-medium text-slate-900 dark:text-white">{event.target}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            {event.amount && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(event.amount, event.asset)}
              </span>
            )}
            {timeAgo(event.minutesAgo)}
          </div>
        </div>
      ))}
    </div>
  );
}
