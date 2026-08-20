"use client";

import { useState } from "react";
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
  Menu,
  X,
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

  const SidebarContent = () => (
    <>
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
              onClick={() => setMobileSidebarOpen(false)}
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
            onClick={() => setMobileSidebarOpen(false)}
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
    </>
  );

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-6 py-10">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24">
          <SidebarContent />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 md:hidden">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-dashboard-nav"
          >
            {mobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            {mobileSidebarOpen ? "Close menu" : "Dashboard menu"}
          </button>
        </div>

        {mobileSidebarOpen && (
          <div id="mobile-dashboard-nav" className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:hidden">
            <SidebarContent />
          </div>
        )}

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
