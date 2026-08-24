/**
 * NetworkBadge.test.tsx
 *
 * NetworkBadge gates a security-relevant check: it must hide only when
 * BOTH `NODE_ENV === "production"` AND `STELLAR_NETWORK === "PUBLIC"` hold
 * (#213). A subtly wrong boolean (inverted condition, `||` instead of `&&`)
 * would look identical to a correct build in a visual smoke test — both
 * show no badge — so this pins down all four combinations explicitly.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

function renderWithEnv(nodeEnv: string, network: "TESTNET" | "PUBLIC") {
  jest.resetModules();
  jest.doMock("@/lib/config", () => ({ STELLAR_NETWORK: network }));
  const originalNodeEnv = process.env.NODE_ENV;
  Object.defineProperty(process.env, "NODE_ENV", {
    value: nodeEnv,
    configurable: true,
  });

  // Imported after mocking so the module picks up the mocked config and
  // reads process.env.NODE_ENV at call time (inside the component body).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NetworkBadge } = require("./NetworkBadge");
  const result = render(<NetworkBadge />);

  Object.defineProperty(process.env, "NODE_ENV", {
    value: originalNodeEnv,
    configurable: true,
  });
  jest.dontMock("@/lib/config");

  return result;
}

describe("NetworkBadge", () => {
  it("hides the badge for a production build on PUBLIC (the only hidden case)", () => {
    renderWithEnv("production", "PUBLIC");
    expect(screen.queryByText("PUBLIC")).not.toBeInTheDocument();
    expect(screen.queryByText("TESTNET")).not.toBeInTheDocument();
  });

  it("shows the badge for a production build on TESTNET — the dangerous misconfiguration", () => {
    renderWithEnv("production", "TESTNET");
    expect(screen.getByText("TESTNET")).toBeInTheDocument();
  });

  it("shows the badge for a non-production (dev) build on PUBLIC", () => {
    renderWithEnv("development", "PUBLIC");
    expect(screen.getByText("PUBLIC")).toBeInTheDocument();
  });

  it("shows the badge for a non-production (dev) build on TESTNET", () => {
    renderWithEnv("development", "TESTNET");
    expect(screen.getByText("TESTNET")).toBeInTheDocument();
  });
});
