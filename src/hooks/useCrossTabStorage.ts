"use client";

import { useEffect } from "react";

/**
 * Subscribes to the native `storage` event so that a `localStorage` write
 * made in one tab is reflected in every other same-origin tab. The browser
 * only fires this event in tabs *other* than the one that made the write,
 * so this is purely additive reconciliation — it never fires for, and
 * never needs to guard against, the tab's own same-tab state updates (#84).
 *
 * `newValue` is `null` when the key was removed (e.g. logout/disconnect)
 * and the new string value otherwise (e.g. login/connect from another tab).
 */
export function useCrossTabStorage(
  key: string,
  onChange: (newValue: string | null) => void,
) {
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== key) return;
      onChange(event.newValue);
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, onChange]);
}
