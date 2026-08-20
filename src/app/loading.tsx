export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-6 animate-pulse">
      <div className="h-8 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
      <div className="grid gap-4 sm:grid-cols-3 mt-8">
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="space-y-3 mt-8">
        <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
      <p className="text-xs text-slate-400 text-center pt-4">Loading {'home'}…</p>
    </div>
  );
}
