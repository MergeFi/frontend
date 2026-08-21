import { Suspense } from "react";
import { CallbackClient } from "./CallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-6 py-24 text-center text-slate-500 dark:text-slate-400">
          Finishing sign-in…
        </div>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
