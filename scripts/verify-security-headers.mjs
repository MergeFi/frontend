#!/usr/bin/env node
// Boots the production build and asserts the security headers from
// next.config.ts (#50) are present on real HTTP responses — configuration
// presence alone doesn't prove Next.js actually applies it to a given
// route, so this hits the app over the network the same way a browser
// would.
//
// Usage: npm run build && node scripts/verify-security-headers.mjs

import { spawn } from "node:child_process";

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const EXPECTED_HEADERS = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=86400",
};

// A representative spread: the static homepage, a dynamic route, the OAuth
// callback page specifically named in the issue, a non-page asset route,
// and a 404 — headers must apply to all of them, not just happy-path pages.
const ROUTES_TO_CHECK = [
  "/",
  "/issues",
  "/auth/callback",
  "/robots.txt",
  "/this-route-does-not-exist",
];

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        await fetch(url);
        resolve();
      } catch {
        if (Date.now() > deadline) {
          reject(new Error(`Server did not start within ${timeoutMs}ms`));
          return;
        }
        setTimeout(attempt, 200);
      }
    };
    attempt();
  });
}

async function main() {
  const server = spawn(
    "npx",
    ["next", "start", "-p", String(PORT)],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  let serverOutput = "";
  server.stdout.on("data", (chunk) => (serverOutput += chunk.toString()));
  server.stderr.on("data", (chunk) => (serverOutput += chunk.toString()));

  const failures = [];

  try {
    await waitForServer(BASE_URL, 30_000);

    for (const route of ROUTES_TO_CHECK) {
      const response = await fetch(`${BASE_URL}${route}`);
      for (const [headerName, expectedValue] of Object.entries(EXPECTED_HEADERS)) {
        const actualValue = response.headers.get(headerName);
        if (actualValue !== expectedValue) {
          failures.push(
            `${route}: expected "${headerName}: ${expectedValue}", got ${
              actualValue === null ? "(missing)" : `"${headerName}: ${actualValue}"`
            }`,
          );
        }
      }
    }
  } catch (err) {
    console.error(serverOutput);
    throw err;
  } finally {
    server.kill();
  }

  if (failures.length > 0) {
    console.error("Security header verification failed:\n");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `All security headers present and correct on ${ROUTES_TO_CHECK.length} routes.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
