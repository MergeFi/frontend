"use client";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{'Profile not available'}</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {'This reputation profile could not be loaded.'}
      </p>
      {error.digest && (
        <p className="mt-3 text-xs text-slate-400 font-mono">Ref: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        Retry
      </button>
    </div>
  );
}
