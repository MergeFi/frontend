import { NextResponse, type NextRequest } from "next/server";

/**
 * Nonce-based CSP middleware (#610).
 *
 * Generates a per-request cryptographic nonce and sets it in the
 * Content-Security-Policy header. The nonce is also exposed via the
 * `x-nonce` request header so layout.tsx can pass it to React's
 * `nonce` prop on the root <html> element (React 19 threads it through
 * to all hydration inline scripts).
 *
 * With `'strict-dynamic'`, scripts loaded by an already-trusted script
 * are also trusted, so Next.js's own runtime script can load its chunks
 * without a separate origin allowlist entry.
 */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());

  const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : "http://localhost:4000";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://avatars.githubusercontent.com https://api.dicebear.com data:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  // The nonce must travel on the *request* so `headers()` in layout.tsx can
  // read it — setting it on the response left the inline init scripts with
  // an undefined nonce, which the nonce-based CSP then blocked (#833).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public assets
     */
    {
      source: "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
