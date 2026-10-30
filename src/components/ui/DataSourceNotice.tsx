import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { messages } from "@/lib/messages";

export interface DataSourceNoticeProps {
  /** The data source. "live" renders nothing (no noise when data is real). */
  source?: "live" | "mock";
  /** Visual variant: "badge" is a small pill, "inline" is plain text, "banner" is prominent banner. */
  variant?: "badge" | "inline" | "banner";
  /** Override the label text. Defaults to "Sample data". */
  label?: string;
  className?: string;
}

/** Compact inline chip, for labelling a specific section. */
export function SampleDataChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      {messages["data.sample"]}
    </span>
  );
}

/** Prominent banner or badge explaining that data is illustrative / mock. */
export function DataSourceNotice({
  source,
  variant,
  label = "Sample data",
  className,
}: DataSourceNoticeProps) {
  if (source === "live") return null;

  if (variant === "inline") {
    return (
      <span
        className={cn("text-xs text-amber-600 dark:text-amber-400", className)}
        role="status"
      >
        {label}
      </span>
    );
  }

  if (source !== undefined && variant !== "banner") {
    return (
      <span
        className={cn(
          "rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
          className,
        )}
        role="status"
      >
        {label}
      </span>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-medium">{messages["data.sample"]}.</span>{" "}
        {messages["data.sampleExplainer"]}
      </p>
    </div>
  );
}
