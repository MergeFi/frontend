import { getToken, setToken, clearToken, TOKEN_KEY } from "./auth";

describe("auth token storage (src/lib/auth.ts)", () => {
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it("stores and retrieves a token successfully on roundtrip", () => {
    expect(getToken()).toBeNull();

    setToken("test-bearer-token-xyz");
    expect(getToken()).toBe("test-bearer-token-xyz");
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe("test-bearer-token-xyz");
  });

  it("clears a stored token successfully", () => {
    setToken("token-to-delete");
    expect(getToken()).toBe("token-to-delete");

    clearToken();
    expect(getToken()).toBeNull();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("returns null when window is undefined (SSR environment)", () => {
    const windowSpy = jest.spyOn(global, "window", "get");
    // @ts-expect-error simulating SSR
    windowSpy.mockImplementation(() => undefined);

    expect(getToken()).toBeNull();
  });

  it("swallows localStorage.getItem exceptions (e.g. Safari private mode quota errors)", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });

    expect(() => getToken()).not.toThrow();
    expect(getToken()).toBeNull();
  });

  it("swallows localStorage.setItem exceptions gracefully without throwing", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });

    expect(() => setToken("test-token")).not.toThrow();
  });

  it("swallows localStorage.removeItem exceptions gracefully without throwing", () => {
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("SecurityError", "SecurityError");
    });

    expect(() => clearToken()).not.toThrow();
  });
});
