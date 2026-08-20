"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-400 mb-6">
            An unexpected error occurred. This has been logged for investigation.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-500 mb-4 font-mono">Error ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
