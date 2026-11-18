#!/usr/bin/env node
// Per-file coverage floor (#934).
//
// jest.config.ts's single 50% global threshold lets well-covered modules
// subsidise untested ones, so a brand-new untested file never fails CI. A
// per-path `coverageThreshold` entry would fix that, but Jest subtracts every
// file matched by a path/glob entry from the `global` aggregate — moving the
// heavily tested src/lib and src/hooks files out of `global` could drop it
// below 50% for reasons unrelated to the change being tested. This script
// enforces the per-file floor separately, from the json-summary report that
// `npm test` (jest --coverage) writes, and leaves `global` untouched.
//
// Raise a floor as the tree's coverage improves; extend FLOORS to new
// directories once every file in them has a test.
//
// Usage: npm test && node scripts/check-coverage-floor.mjs

import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SUMMARY_PATH = fileURLToPath(new URL("../coverage/coverage-summary.json", import.meta.url));

// Minimum line coverage, per file, for every file under each prefix.
const FLOORS = [
  { prefix: "src/lib/", lines: 20 },
  { prefix: "src/hooks/", lines: 20 },
];

let summary;
try {
  summary = JSON.parse(readFileSync(SUMMARY_PATH, "utf8"));
} catch {
  console.error(
    `${SUMMARY_PATH} not found or unreadable — run \`npm test\` (jest --coverage) first.`,
  );
  process.exit(1);
}

const failures = [];
for (const [file, metrics] of Object.entries(summary)) {
  if (file === "total") continue;
  const rel = relative(PROJECT_ROOT, file).split("\\").join("/");
  const floor = FLOORS.find((entry) => rel.startsWith(entry.prefix));
  if (!floor) continue;
  const pct = Number(metrics.lines?.pct);
  if (Number.isFinite(pct) && pct < floor.lines) {
    failures.push(`${rel}: ${pct}% lines, below the ${floor.lines}% per-file floor`);
  }
}

if (failures.length > 0) {
  console.error("Per-file coverage floor not met:\n");
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error("\nAdd or extend this file's test, or see scripts/check-coverage-floor.mjs.");
  process.exit(1);
}

console.log(`Per-file coverage floor met for ${FLOORS.map((f) => f.prefix).join(", ")}.`);
