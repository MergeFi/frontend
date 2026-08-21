/**
 * computeTrend — last-period-vs-prior-period percentage change.
 *
 * Computes the trend indicator value for dashboard StatCards from a
 * historical data series (the same series already passed to the card's
 * `sparkline` prop). This replaces the previous hardcoded literal trends
 * (12 / 8 / 18) that were passed regardless of the underlying data.
 *
 * METHOD
 * ──────
 * Compares the most recent value in the series against the value immediately
 * before it — i.e. week-over-week for the 8-week sparkline arrays used across
 * the dashboards:
 *
 *   trend = ((latest - prior) / prior) * 100
 *
 * Returned as a rounded whole number to match StatCard's "N% vs last period"
 * integer display.
 *
 * RETURN VALUES
 * ─────────────
 *  - A positive number → latest period up vs prior period.
 *  - A negative number → latest period down vs prior period.
 *  - `0`               → latest period unchanged vs prior period. NOTE:
 *    StatCard's `trendUp = typeof trend === "number" && trend >= 0` renders a
 *    genuine `0` with the green up arrow — a pre-existing ambiguity in StatCard
 *    (acknowledged in the issue and PR), not introduced by this fix.
 *  - `undefined`       → not enough data to compare (fewer than 2 points) or
 *    the prior period is 0 (division by zero). Callers must not fabricate a
 *    placeholder in these cases; `undefined` hides the trend row entirely.
 *
 * This helper works unchanged for both data sources: the demo mock arrays today
 * and the live backend history once the mock-sparkline issue lands, because the
 * call sites pass whatever array is displayed as the sparkline.
 */
export function computeTrend(
  history: readonly number[] | undefined,
): number | undefined {
  if (!history || history.length < 2) return undefined;

  const latest = history[history.length - 1];
  const prior = history[history.length - 2];

  if (prior === 0) return undefined;

  return Math.round(((latest - prior) / prior) * 100);
}
