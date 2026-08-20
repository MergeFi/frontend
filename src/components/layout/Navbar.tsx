"use client";

import { useState } from "react";
import Link from "next/link";
import { GitMerge, ChevronDown, LogOut, Menu, X } from "lucide-react";
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

const dashboardLinks: { href: string; label: string; role: UserRole }[] = [
  { href: "/dashboard/contributor", label: "Contributor", role: "contributor" },
  { href: "/dashboard/maintainer", label: "Maintainer", role: "maintainer" },
  { href: "/dashboard/sponsor", label: "Sponsor", role: "sponsor" },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter dashboard links to only those matching the user's assigned roles.
  // Supports multi-role users: if roles contains both "maintainer" and "sponsor",
  // both dashboard links are shown. If no roles yet (e.g. new user), show none.
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
            {/* Only show Dashboards dropdown if there are visible role-based links */}
            {visibleDashboardLinks.length > 0 && (
              <div className="group relative">
                <button className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
                  Dashboards
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="invisible absolute left-0 top-full pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <div className="w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
                    {visibleDashboardLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ))}
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
          {!loading && (
              <button
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
            <NetworkBadge />
          <ThemeToggle />
          {loading ? (
            /* Loading skeleton: stable placeholder matching the logged-in layout dimensions
               to prevent flash of logged-out buttons before auth resolves. */
            <div className="flex items-center gap-3">
              <div className="h-7 w-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
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
    
      {/* Mobile navigation drawer (#78) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-nav"
            role="dialog"
            aria-label="Mobile navigation"
            className="fixed right-0 top-0 bottom-0 w-72 overflow-y-auto bg-white p-6 shadow-xl dark:bg-slate-950"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {link.label}
                </Link>
              ))}
              {visibleDashboardLinks.length > 0 && (
                <>
                  <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Dashboards
                  </p>
                  {visibleDashboardLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {link.label}
                    </Link>
                  ))}
                </>
              )}
              {user && (
                <Link
                  href={`/reputation/${user.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Reputation
                </Link>
              )}
            </div>
            {user && (
              <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
