"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitPullRequest,
  Milestone,
  Trophy,
  Users,
  Wallet,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "contributor" | "maintainer" | "sponsor";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navByRole: Record<Role, NavItem[]> = {
  contributor: [
    { label: "Overview", href: "/dashboard/contributor", icon: LayoutDashboard },
    { label: "Browse bounties", href: "/issues", icon: GitPullRequest },
    { label: "Reputation", href: "/reputation/priyaeth", icon: Trophy },
  ],
  maintainer: [
    { label: "Overview", href: "/dashboard/maintainer", icon: LayoutDashboard },
    { label: "Bounty pipeline", href: "/issues", icon: GitPullRequest },
    { label: "Milestones", href: "/milestones", icon: Milestone },
    { label: "Team", href: "/dashboard/maintainer", icon: Users },
  ],
  sponsor: [
    { label: "Overview", href: "/dashboard/sponsor", icon: LayoutDashboard },
    { label: "Bounties funded", href: "/issues", icon: Receipt },
    { label: "Milestones", href: "/milestones", icon: Milestone },
    { label: "Payments", href: "/dashboard/sponsor", icon: Wallet },
  ],
};

const roleSwitcher: { role: Role; label: string; href: string }[] = [
  { role: "contributor", label: "Contributor", href: "/dashboard/contributor" },
  { role: "maintainer", label: "Maintainer", href: "/dashboard/maintainer" },
  { role: "sponsor", label: "Sponsor", href: "/dashboard/sponsor" },
];

export function DashboardShell({
  role,
  title,
  subtitle,
  badge,
  action,
  children,
}: {
  role: Role;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = navByRole[role];
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-6 py-10">
      {/* Mobile sidebar toggle — shown only below md breakpoint */}
      <button
        className="md:hidden w-full flex items-center justify-between py-2 mb-4 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={() => setMobileSidebarOpen(true)}
        aria-expanded={mobileSidebarOpen}
        aria-controls="mobile-dashboard-sidebar"
      >
        Dashboard <ChevronDown className="h-4 w-4" />
        <span className="sr-only">Open dashboard navigation</span>
      </button>

      <aside
        className="hidden w-56 shrink-0 md:block"
        id="mobile-dashboard-sidebar"
      >
        <div className="sticky top-24">
          <p className="px-3 text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Dashboard
          </p>
          <nav className="mt-3 space-y-1">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <p className="mt-8 px-3 text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Switch role
          </p>
          <nav className="mt-3 space-y-1">
            {roleSwitcher.map((r) => (
              <Link
                key={r.role}
                href={r.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  r.role === role
                    ? "font-medium text-slate-900 dark:text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-white",
                )}
              >
                {r.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-30 bg-white/95 dark:bg-slate-950/80 left-0 top-0 bottom-0 transition-transform",
          mobileSidebarOpen ? "translate-x-0" : "translate-x-full",
        )}
        onClick={() => setMobileSidebarOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setMobileSidebarOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard navigation"
      >
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">Dashboard</h2>
          <button
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
        <div className="p-6 space-y-2">
          <nav className="space-y-1">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <p className="mt-8 px-3 text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Switch role
          </p>
          <nav className="mt-3 space-y-1">
            {roleSwitcher.map((r) => (
              <Link
                key={r.role}
                href={r.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  r.role === role
                    ? "font-medium text-slate-900 dark:text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-white",
                )}
              >
                {r.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          {action}
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
