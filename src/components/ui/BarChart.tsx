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

  return (
    <div className="flex gap-2" style={{ height }}>
      {data.map((d) => {
        const pct = Math.max((d.value / max) * 100, 2);
        return (
          <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
            <div className="relative flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-8 rounded-t-md bg-indigo-500/80 transition-colors group-hover:bg-indigo-500 dark:bg-indigo-400/70 dark:group-hover:bg-indigo-400"
                style={{ height: `${pct}%` }}
                title={formatValue ? formatValue(d.value) : String(d.value)}
              />
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
