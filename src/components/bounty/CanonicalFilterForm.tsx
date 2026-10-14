"use client";

import { useRef } from "react";

/**
 * A filter <form> that strips default/empty fields before the GET submit, so
 * "Apply filters" produces the canonical URL (/issues, or ?status=open) and
 * not ?difficulty=all&asset=all&minReward=&maxReward=&sort=default (#701).
 *
 * HTML form submission serializes every named field — including the "all" /
 * "default" selects and empty inputs — bypassing buildIssuesHref's
 * default-omission. Disabling those fields at submit-time keeps them out of
 * the URL while leaving the visible controls untouched (the re-enabled state
 * is irrelevant — the navigation's already happened).
 *
 * `defaults` maps field-name → the value treated as "no filter" (omitted).
 */
export function CanonicalFilterForm({
  defaults,
  className,
  children,
}: {
  defaults: Record<string, string>;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);

  const stripDefaults = () => {
    const form = ref.current;
    if (!form) return;
    for (const el of Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[name]"),
    )) {
      const v = el.value;
      const isDefault = el.name in defaults && v === defaults[el.name];
      const isEmpty = el.tagName === "INPUT" && v.trim() === "";
      // Disable → the field isn't serialized into the GET URL.
      el.disabled = isDefault || isEmpty;
    }
  };

  return (
    <form
      ref={ref}
      method="get"
      action="/issues"
      onSubmit={stripDefaults}
      className={className}
    >
      {children}
    </form>
  );
}
