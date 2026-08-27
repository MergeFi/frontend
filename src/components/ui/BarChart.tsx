export interface BarChartPoint {
  label: string;
  value: number;
}

export function BarChart({
  data,
  height = 160,
  formatValue,
}: {
  data: BarChartPoint[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const format = formatValue ?? ((v: number) => String(v));

  return (
    // The bars are visual-only (a hover `title` is invisible to keyboards
    // and screen readers), so the accessible copy of the data lives in a
    // visually-hidden caption list and the rendered bars are marked
    // aria-hidden. Screen readers announce every label:value pair as text
    // instead of an unlabeled "#206"-era div stack (#15).
    <figure className="m-0" style={{ height }}>
      <figcaption className="sr-only">
        <ul>
          {data.map((d) => (
            <li key={d.label}>
              {d.label}: {format(d.value)}
            </li>
          ))}
        </ul>
      </figcaption>
      <div aria-hidden="true" className="flex gap-2" style={{ height }}>
        {data.map((d) => {
          const pct = Math.max((d.value / max) * 100, 2);
          // The 2% floor above keeps a zero (or near-zero) value visible
          // instead of collapsing to nothing, but that same floor made a
          // negative value render as an identical small bar with no visual
          // distinction from a genuine zero/near-zero positive — the sign
          // was completely lost. A distinct color at least keeps the sign
          // visible at a glance; the exact signed figure is in the hidden
          // caption list either way (#206).
          const isNegative = d.value < 0;
          return (
            <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full flex-1 items-end justify-center">
                <div
                  className={
                    isNegative
                      ? "w-full max-w-8 rounded-t-md bg-rose-500/80 transition-colors group-hover:bg-rose-500 dark:bg-rose-400/70 dark:group-hover:bg-rose-400"
                      : "w-full max-w-8 rounded-t-md bg-indigo-500/80 transition-colors group-hover:bg-indigo-500 dark:bg-indigo-400/70 dark:group-hover:bg-indigo-400"
                  }
                  style={{ height: `${pct}%` }}
                  title={format(d.value)}
                />
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{d.label}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
