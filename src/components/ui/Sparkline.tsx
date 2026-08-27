export function Sparkline({
  data,
  width = 96,
  height = 32,
  className,
  label,
  decorative = false,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  /** Overrides the auto-generated trend description for screen readers. */
  label?: string;
  /**
   * Marks the sparkline as decorative when the surrounding text already
   * conveys the trend (e.g. StatCard's "+12% vs last period"), so screen
   * readers don't hear the same number twice.
   */
  decorative?: boolean;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  // The line itself is pure color-only decoration; the accessible value is
  // the trend summary. Whole-point rounding keeps the announcement readable
  // while matching what the shape actually shows (#15).
  const first = data[0];
  const last = data[data.length - 1];
  const changePct = first === 0 ? null : Math.round(((last - first) / Math.abs(first)) * 100);
  const trendSummary =
    label ??
    (changePct === null
      ? `Trend from ${first} to ${last}`
      : `Trend from ${first} to ${last} (${Math.abs(changePct)}% ${changePct >= 0 ? "increase" : "decrease"})`);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": trendSummary })}
    >
      <polyline
        points={areaPoints}
        fill="currentColor"
        className="opacity-10"
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
