import type { Metadata } from "next";
import SponsorDashboardClient from "./SponsorDashboardClient";

export const metadata: Metadata = {
  // robots.txt Disallow stops crawling, not indexing — a linked-from-elsewhere
  // disallowed URL can still be indexed. noindex keeps the dashboards out of
  // search results entirely (#677).
  robots: { index: false },
  title: "Sponsor Dashboard | MergeFi",
  description:
    "Track spending, active bounties, and escrowed budget across the repositories you fund.",
};

export default function SponsorDashboardPage() {
  return <SponsorDashboardClient />;
}
