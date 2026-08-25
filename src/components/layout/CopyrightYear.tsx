"use client";

import { useEffect, useState } from "react";

/**
 * Footer is a Server Component with no dynamic API usage of its own, so
 * Next.js can statically optimize routes that render it — new Date() called
 * server-side is then evaluated once, at build time, not per-request. On a
 * statically-optimized route this silently froze the displayed year at
 * whatever `next build` was run, with nothing correcting it for the rest of
 * that build's lifetime (#221).
 *
 * Isolating just the year into this small Client Component lets it
 * self-correct on every page load: the initial render (SSR/build-time) uses
 * whatever Date.now() was available then, but the effect below always runs
 * client-side, on every hydration, and re-reads the browser's actual
 * current date — so a stale build-time year gets fixed the moment any
 * visitor's browser hydrates the page, rather than staying wrong until the
 * next deploy.
 */
export function CopyrightYear() {
  const [year, setYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    // Corrects a stale build-time year on mount — the same pattern used
    // elsewhere in this app for reconciling client-only state after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear());
  }, []);

  return <>{year}</>;
}
