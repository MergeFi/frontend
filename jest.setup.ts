// Set safe, deterministic test-time defaults for NEXT_PUBLIC_* env vars so
// tests running against a fresh clone succeed out of the box (#474)
process.env.NEXT_PUBLIC_STELLAR_NETWORK ??= "TESTNET";
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:4000/api";

// Extend Jest's built-in matchers with jest-dom's DOM-specific matchers
// (e.g. toBeInTheDocument, toHaveAttribute, toHaveClass)
import "@testing-library/jest-dom";
