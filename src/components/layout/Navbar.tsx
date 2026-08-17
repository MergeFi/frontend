"use client";

import Link from "next/link";
import { GitMerge, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NetworkBadge } from "@/components/ui/NetworkBadge";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/issues", label: "Bounties" },
  { href: "/milestones", label: "Milestones" },
];

const dashboardLinks = [
  { href: "/dashboard/contributor", label: "Contributor" },
  { href: "/dashboard/maintainer", label: "Maintainer" },
  { href: "/dashboard/sponsor", label: "Sponsor" },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);

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
            <div className="group relative">
              <button
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                onClick={setDashboardDropdownOpen}
              >
                Dashboards
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
<div
                className={`
                  invisible absolute left-0 top-full pt-3
                  transition-all ease-in-out duration-150
                  ${dashboardDropdownOpen ? "opacity-100 visible" : "opacity-0 invisible"}
                  group-hover:visible group-hover:opacity-100
                `}
              >
                <div className="w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
                  {dashboardLinks.map((link) => (
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
            {user && (
              <Link href={`/reputation/${user.username}`} className="hover:text-slate-900 dark:hover:text-white">
                Reputation
              </Link>
            )}
          </nav>
          {/* Hamburger button — shown only below md breakpoint */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
            <span className="sr-only">Toggle navigation menu</span>
          </button>
        </div>
        {/* Mobile navigation drawer — shown when menu is open below md */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav"
            className="fixed inset-0 z-40 bg-white/95 dark:bg-slate-950/80 overflow-y-auto"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-14 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">Navigation</h2>
              <button
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
            <div className="p-6 space-y-2">
              <nav className="space-y-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {link.label}
                  </Link>
                ))}
                {user && (
                  <div className="mt-4">
                    <Link
                      href={`/reputation/${user.username}`}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Reputation
                    </Link>
                  </div>
                )}
                {user && (
                  <div>
                    <button
                      onClick={logout}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="Sign out"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </nav>
            </div>
            {/* Dashboard links section */}
            {dashboardLinks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Dashboards</h3>
                <nav className="space-y-1">
                  {dashboardLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
