"use client";

import { cn } from "@/lib/utils";
import { useRef, useCallback, type KeyboardEvent } from "react";

/**
 * WAI-ARIA Tabs Pattern (Issue #24):
 * - role="tablist" on container, role="tab" on each button, role="tabpanel" expected on consumer
 * - aria-selected reflects active state
 * - aria-controls links tab to its panel via id pairing
 * - Roving tabindex: only active tab has tabIndex=0; others have tabIndex=-1
 * - Arrow Left/Right moves focus between tabs (wrapping)
 * - Home/End jump to first/last tab
 * - Activation is automatic on focus (WAI-ARIA recommended default for dashboards)
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (key: T) => void;
}) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const setTabRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      if (el) {
        tabRefs.current.set(key, el);
      } else {
        tabRefs.current.delete(key);
      }
    },
    [],
  );

  const focusTab = useCallback((key: T) => {
    tabRefs.current.get(key)?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const keys = tabs.map((t) => t.key);
      const currentIndex = keys.indexOf(active);
      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = (currentIndex + 1) % keys.length;
          break;
        case "ArrowLeft":
          nextIndex = (currentIndex - 1 + keys.length) % keys.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = keys.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      const nextKey = keys[nextIndex];
      // Automatic activation: change tab AND move focus
      onChange(nextKey);
      focusTab(nextKey);
    },
    [tabs, active, onChange, focusTab],
  );

  return (
    <div
      role="tablist"
      aria-label="Content sections"
      onKeyDown={handleKeyDown}
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const tabId = `tab-${tab.key}`;
        const panelId = `panel-${tab.key}`;

        return (
          <button
            key={tab.key}
            ref={setTabRef(tab.key)}
            id={tabId}
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-700"
                    : "bg-slate-200/60 dark:bg-slate-800",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
