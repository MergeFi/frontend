// Extend Jest's built-in matchers with jest-dom's DOM-specific matchers
// (e.g. toBeInTheDocument, toHaveAttribute, toHaveClass)
import "@testing-library/jest-dom";

if (!process.env.NEXT_PUBLIC_STELLAR_NETWORK) {
  process.env.NEXT_PUBLIC_STELLAR_NETWORK = "TESTNET";
}
