import type { Metadata } from "next";
import { Suspense } from "react";
import ContributorDashboardClient from "./ContributorDashboardClient";

export const metadata: Metadata = {
  // robots.txt Disallow stops crawling, not indexing — a linked-from-elsewhere
  // disallowed URL can still be indexed. noindex keeps the dashboards out of
  // search results entirely (#677).
  robots: { index: false },
  title: "Contributor Dashboard | MergeFi",
  description:
    "Track your earnings, merged pull requests, and active claims on MergeFi.",
};

export default function ContributorDashboardPage() {
  return (
    <Suspense fallback={null}>
      <ContributorDashboardClient />
    </Suspense>
  );
}
