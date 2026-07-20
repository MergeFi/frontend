import { STELLAR_NETWORK } from "@/lib/config";
import { Badge } from "@/components/ui/Badge";

/**
 * Visible network indicator (#26). Build-time validation (next.config.ts)
 * already stops an unset/misspelled NEXT_PUBLIC_STELLAR_NETWORK from ever
 * shipping — this catches the case that slips past that check anyway: a
 * value that's individually valid ("TESTNET" or "PUBLIC") but wrong for
 * *this* deployment, e.g. a correct-looking env var set at the wrong
 * hosting environment/account level.
 *
 * Hidden only when both of these hold: this is an optimized production
 * build (`next build` + `next start`, not `next dev`) *and* it's
 * configured for the real Stellar network. Any other combination — local
 * dev, or a "production" build that's actually still pointed at TESTNET —
 * shows the badge, since the latter is exactly the dangerous
 * misconfiguration this issue is about and a NODE_ENV-only check would
 * miss it entirely.
 */
export function NetworkBadge() {
  const isProductionBuild = process.env.NODE_ENV === "production";
  const isRealNetwork = STELLAR_NETWORK === "PUBLIC";
  if (isProductionBuild && isRealNetwork) return null;

  return (
    <span title={`This build is configured for the Stellar ${STELLAR_NETWORK} network`}>
      <Badge className="border border-amber-300 bg-amber-50 font-mono text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        {STELLAR_NETWORK}
      </Badge>
    </span>
  );
}
