// Safe, deterministic test-time defaults for NEXT_PUBLIC_* variables (#474).
// These ensure tests run cleanly out of the box after a fresh git clone
// without requiring a local .env.local file or CI job-level env overrides.
process.env.NEXT_PUBLIC_STELLAR_NETWORK ??= "TESTNET";
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:4000/api";

// Extend Jest's built-in matchers with jest-dom's DOM-specific matchers
// (e.g. toBeInTheDocument, toHaveAttribute, toHaveClass)
import "@testing-library/jest-dom";
