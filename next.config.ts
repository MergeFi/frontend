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
 * - X-Content-Type-Options: nosniff — stops the browser from MIME-sniffing
 *   a response into an executable content type.
 * - Referrer-Policy: strict-origin-when-cross-origin — the GitHub OAuth
 *   callback at /auth/callback carries a short-lived token in its query
 *   string (see CallbackClient.tsx); this keeps the full URL out of the
 *   Referer header sent with any cross-origin request, while still
 *   sending it for same-origin requests, which is the least surprising
 *   choice absent a reason to be stricter.
 * - Strict-Transport-Security: deliberately conservative to start — a
 *   short max-age, no `includeSubDomains`, no `preload`. HSTS is
 *   effectively irreversible once a browser has cached it (and
 *   preload-list removal is slow), so this is a "start small" rollout:
 *   once this has run in production for a while with no HTTPS/cert
 *   issues, raise max-age and add `includeSubDomains`, and only add
 *   `preload` (and submit to hstspreload.org) once *that* has been stable
 *   too. The browser ignores this header entirely over plain HTTP, so
 *   it's harmless to always send.
 *
 * Deliberately does NOT set Content-Security-Policy — that's tracked by a
 * separate issue so it can compose correctly with the theme-init inline
 * script (`themeInitScript` from ThemeContext, rendered in layout.tsx)
 * without this change guessing at a nonce/hash strategy it doesn't own.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=86400" },
];

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
