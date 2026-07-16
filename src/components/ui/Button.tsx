import { ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm shadow-slate-900/10 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
  secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  outline: "bg-white border border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

// هنا كنعرفوا النوع الجديد اللي كيسمح لينا نستعملوا 'as'
type ButtonOrLinkProps = 
  | (ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" });

interface ButtonProps extends ButtonOrLinkProps {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, as: Component = "button", ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    // كنرندريو الـ Component حسب الـ 'as' اللي تعطينا
    return <Component ref={ref as any} className={classes} {...props} />;
  }
);

Button.displayName = "Button";
