import { forwardRef, type ElementType, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ClassValue } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800 shadow-sm shadow-slate-900/10 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
  secondary:
    "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  outline:
    "bg-white border border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

type ButtonOwnProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: ClassValue;
  children?: ReactNode;
};

export type ButtonProps<C extends ElementType = "button"> = ButtonOwnProps &
  Omit<ComponentPropsWithRef<C>, keyof ButtonOwnProps | "as"> & {
    as?: C;
  };

export const Button = forwardRef(function Button(
  { as, variant = "primary", size = "md", loading, className, disabled, children, ...props }: ButtonOwnProps & Record<string, unknown>,
  ref: React.Ref<unknown>,
) {
  const Component = (as ?? "button") as ElementType;
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className as ClassValue,
      )}
      disabled={Component === "button" ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
        </span>
      )}
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {children as ReactNode}
      </span>
    </Component>
  );
}) as <C extends ElementType = "button">(props: ButtonProps<C>) => React.ReactElement | null;
