import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsor Dashboard | MergeFi",
};

export default function SponsorDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
