export default function ReputationLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
      {/* Header section: Avatar, handle, bio skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-3">
          <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-4 h-7 w-20 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Languages & activity section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-44 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
        <div className="h-44 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
