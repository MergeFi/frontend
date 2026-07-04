import Link from "next/link";
import { GitMerge } from "lucide-react";

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/issues", label: "Browse bounties" },
      { href: "/milestones", label: "Milestones" },
      { href: "/connect", label: "Connect GitHub" },
    ],
  },
  {
    title: "Roles",
    links: [
      { href: "/dashboard/contributor", label: "Contributors" },
      { href: "/dashboard/maintainer", label: "Maintainers" },
      { href: "/dashboard/sponsor", label: "Sponsors" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <GitMerge className="h-4 w-4" />
              </span>
              MergeFi
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              The financial infrastructure for open source. Merge code. Earn
              instantly. Built on Stellar &amp; Soroban.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} MergeFi. All rights reserved.</p>
          <p>Where open source meets finance.</p>
        </div>
      </div>
    </footer>
  );
}
