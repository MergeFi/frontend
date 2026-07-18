import type { NextConfig } from "next";

/**
 * Production security headers (#50), applied to every route below.
 *
 * - X-Frame-Options: DENY — MergeFi has no legitimate iframe-embedding use
 *   case (checked: no `iframe`/embed usage anywhere in this app), and
 *   real-money actions (fund/claim) are one click away in this UI, making
 *   clickjacking a genuine risk. If a legitimate embed need shows up later
 *   (e.g. a GitHub App/marketplace surface), relax this to a scoped
 *   `frame-ancestors` allowlist via CSP instead of removing it outright.
 */
const securityHeaders = [{ key: "X-Frame-Options", value: "DENY" }];

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
