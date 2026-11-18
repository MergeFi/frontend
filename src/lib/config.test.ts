/**
 * config.test.ts (#913)
 *
 * config.ts validates the environment when it is imported, so an invalid
 * value must make the import itself throw, and the exported URLs must be
 * built from the validated (trailing-slash-stripped) API base URL.
 */

const ORIGINAL_ENV = process.env;

function loadConfig(env: Record<string, string | undefined>) {
  process.env = { ...ORIGINAL_ENV, ...env };
  let config: typeof import("./config") | undefined;
  jest.isolateModules(() => {
    // Required inside isolateModules so each call re-runs the module-load
    // validation against the stubbed environment.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    config = require("./config");
  });
  return config as typeof import("./config");
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("config", () => {
  it("throws on import when NEXT_PUBLIC_STELLAR_NETWORK is invalid", () => {
    expect(() =>
      loadConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "MAINNET" }),
    ).toThrow(/NEXT_PUBLIC_STELLAR_NETWORK/);
  });

  it("exports the validated network", () => {
    const config = loadConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "PUBLIC" });

    expect(config.STELLAR_NETWORK).toBe("PUBLIC");
  });

  it.each(["https://api.example.com/api", "https://api.example.com/api/"])(
    "builds GITHUB_OAUTH_URL with exactly one slash from %p",
    (apiUrl) => {
      const config = loadConfig({
        NEXT_PUBLIC_STELLAR_NETWORK: "TESTNET",
        NEXT_PUBLIC_API_URL: apiUrl,
      });

      expect(config.API_BASE_URL).toBe("https://api.example.com/api");
      expect(config.GITHUB_OAUTH_URL).toBe("https://api.example.com/api/auth/github");
    },
  );
});
