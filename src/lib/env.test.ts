/**
 * Tests for validateApiUrl's scheme restriction (#204).
 *
 * new URL() alone doesn't restrict the scheme — "javascript:...",
 * "file:///...", and "ftp://..." all parse successfully despite none being
 * meaningful as an HTTP API base URL. This pins down that only http(s) is
 * accepted, and that legitimate http(s) URLs (including the default
 * fallback) still pass.
 */

import { validateApiUrl, EnvValidationError } from "./env";

describe("validateApiUrl — scheme restriction", () => {
  it("accepts an http URL", () => {
    expect(validateApiUrl("http://localhost:4000/api")).toBe("http://localhost:4000/api");
  });

  it("accepts an https URL", () => {
    expect(validateApiUrl("https://api.example.com")).toBe("https://api.example.com");
  });

  it("falls back to the default when unset", () => {
    expect(validateApiUrl(undefined)).toBe("http://localhost:4000/api");
  });

  it("rejects a javascript: scheme", () => {
    expect(() => validateApiUrl("javascript:alert(1)")).toThrow(EnvValidationError);
  });

  it("rejects a file: scheme", () => {
    expect(() => validateApiUrl("file:///etc/passwd")).toThrow(EnvValidationError);
  });

  it("rejects a non-http(s) network scheme like ftp:", () => {
    expect(() => validateApiUrl("ftp://example.com")).toThrow(EnvValidationError);
  });

  it("still rejects a malformed URL with the original error message", () => {
    expect(() => validateApiUrl("not-a-url")).toThrow(/is not a valid URL/);
  });
});
