import Link from "next/link";
import { GitMerge } from "lucide-react";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/issues", label: "Bounties" },
  { href: "/milestones", label: "Milestones" },
  { href: "/dashboard/contributor", label: "Contributors" },
  { href: "/dashboard/maintainer", label: "Maintainers" },
  { href: "/dashboard/sponsor", label: "Sponsors" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <GitMerge className="h-5 w-5 text-emerald-400" />
          MergeFi
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/connect">
            <Button size="sm">Connect GitHub</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
