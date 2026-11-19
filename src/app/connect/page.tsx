import type { Metadata } from "next";
import { ConnectPanel } from "./ConnectPanel";

const connectDescription =
  "Connect GitHub and Stellar accounts to fund issues, claim bounties, and receive MergeFi payouts.";

export const metadata: Metadata = {
  title: "Connect | MergeFi",
  description: connectDescription,
  openGraph: {
    title: "Connect | MergeFi",
    description: connectDescription,
    url: "/connect",
  },
  twitter: {
    card: "summary_large_image",
    title: "Connect | MergeFi",
    description: connectDescription,
  },
};

export default function ConnectPage() {
  return <ConnectPanel />;
}
