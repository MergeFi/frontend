"use client";

import Link from "next/link";
import { GitMerge, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NetworkBadge } from "@/components/ui/NetworkBadge";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

const links = [
  { href: "/issues", label: "Bounties" },
  { href: "/milestones", label: "Milestones" },
];

/**
 * Multi-role UX decision (Issue #48):
 * AuthUser.roles is UserRole[] — a user can hold multiple roles simultaneously
 * (e.g. maintainer + sponsor). The dashboard dropdown now renders ALL applicable
 * role links filtered by the user's actual roles array, rather than assuming
 * single-role membership. Users with zero roles see no dashboard links but
 * still see the authenticated nav (avatar, sign out).
 */
const dashboardLinks: Array<{ href: string; label: string; role: UserRole }> = [
  { href: "/dashboard/contributor", label: "Contributor", role: "contributor" },
  { href: "/dashboard/maintainer", label: "Maintainer", role: "maintainer" },
  { href: "/dashboard/sponsor", label: "Sponsor", role: "sponsor" },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();

  // Filter dashboard links to only those matching the user's assigned roles.
  // When loading, we render a skeleton instead of filtering (avoids flash).
  const visibleDashboardLinks = user
    ? dashboardLinks.filter((link) => user.roles.includes(link.role))
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              <GitMerge className="h-4 w-4" />
            </span>
            MergeFi
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900 dark:hover:text-white">
                {link.label}
              </Link>
            ))}
            {/* Dashboard dropdown: only shown when user has at least one role,
                or as a neutral placeholder during loading to prevent layout shift */}
            {(loading || visibleDashboardLinks.length > 0) && (
              <div className="group relative">
                <button className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
                  Dashboards
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="invisible absolute start-0 top-full pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <div className="w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
                    {loading ? (
                      // Skeleton placeholders during auth hydration — prevents
                      // flash of empty dropdown or wrong links
                      <>
                        <div className="h-8 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <div className="mt-1 h-8 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                      </>
                    ) : (
                      visibleDashboardLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            {user && (
              <Link href={`/reputation/${user.username}`} className="hover:text-slate-900 dark:hover:text-white">
                Reputation
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NetworkBadge />
          <ThemeToggle />
          {loading ? (
            // Stable skeleton during auth hydration — no flash of logged-out
            // state for users with valid persisted sessions
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/reputation/${user.username}`}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <Avatar seed={user.username} src={user.avatarUrl ?? undefined} size={28} />
                {user.displayName ?? user.username}
              </Link>
              <button
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link href="/connect">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Sign in
                </Button>
              </Link>
              <Link href="/connect">
                <Button size="sm">Connect GitHub</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
