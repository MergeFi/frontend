/**
 * Tests for environment variable validation (#26, #204, #420).
 *
 * Tests scheme restrictions for validateApiUrl (#204), and tests strict
 * network validation for validateStellarNetwork (#420) to ensure
 * transactions are never signed with the wrong network passphrase.
 */

import { validateApiUrl, validateStellarNetwork, EnvValidationError } from "./env";

describe("validateStellarNetwork — strict network validation (#420)", () => {
  it("accepts TESTNET", () => {
    expect(validateStellarNetwork("TESTNET")).toBe("TESTNET");
  });

  it("accepts PUBLIC", () => {
    expect(validateStellarNetwork("PUBLIC")).toBe("PUBLIC");
  });

  it("rejects undefined (no default allowed)", () => {
    expect(() => validateStellarNetwork(undefined)).toThrow(EnvValidationError);
    expect(() => validateStellarNetwork(undefined)).toThrow(
      /NEXT_PUBLIC_STELLAR_NETWORK is not set/,
    );
  });

  it("rejects an empty string", () => {
    expect(() => validateStellarNetwork("")).toThrow(EnvValidationError);
    expect(() => validateStellarNetwork("")).toThrow(
      /NEXT_PUBLIC_STELLAR_NETWORK is not set/,
    );
  });

  it("rejects lowercase 'testnet'", () => {
    expect(() => validateStellarNetwork("testnet")).toThrow(EnvValidationError);
    expect(() => validateStellarNetwork("testnet")).toThrow(
      /is not a valid Stellar network/,
    );
  });

  it("rejects lowercase 'public'", () => {
    expect(() => validateStellarNetwork("public")).toThrow(EnvValidationError);
    expect(() => validateStellarNetwork("public")).toThrow(
      /is not a valid Stellar network/,
    );
  });

  it("rejects 'MAINNET' near-miss", () => {
    expect(() => validateStellarNetwork("MAINNET")).toThrow(EnvValidationError);
    expect(() => validateStellarNetwork("MAINNET")).toThrow(
      /is not a valid Stellar network/,
    );
  });

  it("rejects arbitrary invalid network strings", () => {
    expect(() => validateStellarNetwork("FUTURENET")).toThrow(EnvValidationError);
    expect(() => validateStellarNetwork("invalid-network")).toThrow(
      EnvValidationError,
    );
  });
});

describe("validateApiUrl — scheme restriction (#204)", () => {
  it("accepts an http URL", () => {
    expect(validateApiUrl("http://localhost:4000/api")).toBe(
      "http://localhost:4000/api",
    );
  });

  it("accepts an https URL", () => {
    expect(validateApiUrl("https://api.example.com")).toBe(
      "https://api.example.com",
    );
  });

  it("falls back to the default when unset", () => {
    expect(validateApiUrl(undefined)).toBe("http://localhost:4000/api");
  });

  it("rejects a javascript: scheme", () => {
    expect(() => validateApiUrl("javascript:alert(1)")).toThrow(
      EnvValidationError,
    );
  });

  it("rejects a file: scheme", () => {
    expect(() => validateApiUrl("file:///etc/passwd")).toThrow(
      EnvValidationError,
    );
  });

  it("rejects a non-http(s) network scheme like ftp:", () => {
    expect(() => validateApiUrl("ftp://example.com")).toThrow(
      EnvValidationError,
    );
  });

  it("still rejects a malformed URL with the original error message", () => {
    expect(() => validateApiUrl("not-a-url")).toThrow(/is not a valid URL/);
  });
});
