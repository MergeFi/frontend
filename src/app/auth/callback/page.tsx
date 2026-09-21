import type { Metadata } from "next";
import { Suspense } from "react";
import { CallbackClient } from "./CallbackClient";

export const metadata: Metadata = {
  title: "Signing in… | MergeFi",
  description: "Completing GitHub authentication for MergeFi.",
};

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Finishing sign-in…
          </p>
        </div>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
