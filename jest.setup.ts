// Extend Jest's built-in matchers with jest-dom's DOM-specific matchers
// (e.g. toBeInTheDocument, toHaveAttribute, toHaveClass)
import "@testing-library/jest-dom";

// Ensure env validation passes out-of-the-box in local test runs (#474)
process.env.NEXT_PUBLIC_STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";

