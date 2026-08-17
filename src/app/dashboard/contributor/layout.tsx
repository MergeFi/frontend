import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contributor Dashboard | MergeFi",
};

export default function ContributorDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
