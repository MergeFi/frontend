import { ConnectPanel } from "./ConnectPanel";

export const metadata = {
  title: "Connect | MergeFi",
  description: "Connect your GitHub account and Stellar wallet to start claiming bounties or funding open source issues.",
};

export default function ConnectPage() {
  return <ConnectPanel />;
}
