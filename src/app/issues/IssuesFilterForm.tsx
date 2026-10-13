"use client";

import type { ComponentPropsWithoutRef } from "react";

const DEFAULT_FILTER_VALUES: Record<string, string> = {
  status: "all",
  difficulty: "all",
  asset: "all",
  sort: "default",
};

/**
 * Filter form that wraps the GET query submission on `/issues`.
 *
 * Disables empty inputs and default-valued select fields right before native
 * form submission so the browser only appends active filters to the query string.
 * This keeps the submitted URL clean and canonical, matching `buildIssuesHref` (#701).
 */
export function IssuesFilterForm({
  onSubmit,
  ...props
}: ComponentPropsWithoutRef<"form">) {
  return (
    <form
      {...props}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const elements = Array.from(form.elements);
        const disabledByHandler: (HTMLInputElement | HTMLSelectElement)[] = [];

        for (const el of elements) {
          if (
            (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) &&
            el.name &&
            !el.disabled
          ) {
            const val = el.value.trim();
            const isDefault =
              val === "" || DEFAULT_FILTER_VALUES[el.name] === val;

            if (isDefault) {
              el.disabled = true;
              disabledByHandler.push(el);
            }
          }
        }

        onSubmit?.(e);

        if (disabledByHandler.length > 0) {
          if (e.defaultPrevented) {
            for (const el of disabledByHandler) {
              el.disabled = false;
            }
          } else {
            setTimeout(() => {
              for (const el of disabledByHandler) {
                el.disabled = false;
              }
            }, 0);
          }
        }
      }}
    />
  );
}
