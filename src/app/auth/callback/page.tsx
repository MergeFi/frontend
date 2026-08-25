import { Suspense } from "react";
import { CallbackClient } from "./CallbackClient";

/**
 * CallbackClient reads useSearchParams(), which the App Router requires to sit
 * behind a Suspense boundary. Without a fallback the page renders nothing at
 * all until that boundary resolves, so a user completing sign-in sees a blank
 * screen rather than any sign the app is working.
 */
function CallbackFallback() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400"
      />
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400" role="status">
        Finishing sign-in&hellip;
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackClient />
    </Suspense>
  );
}
