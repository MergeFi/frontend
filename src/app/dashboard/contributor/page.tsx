import type { Metadata } from "next";
import ContributorDashboardClient from "./ContributorDashboardClient";

export const metadata: Metadata = {
  title: "Contributor Dashboard | MergeFi",
  description:
    "Track your earnings, merged pull requests, and active claims on MergeFi.",
};

export default function ContributorDashboardPage() {
  return <ContributorDashboardClient />;
}
