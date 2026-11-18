/**
 * seo-policy.test.ts (#911)
 *
 * profileIsIndexable is the enforcement point for an opt-in privacy decision:
 * only an explicit `true` may make a profile indexable. A refactor to a
 * truthiness check or a `?? true` default would flip that to opt-out, so the
 * fail-safe default is pinned here value by value.
 */

import { chunk, MAX_URLS_PER_SITEMAP, profileIsIndexable } from "./seo-policy";

describe("profileIsIndexable", () => {
  it("indexes a profile only when indexable is exactly true", () => {
    expect(profileIsIndexable({ indexable: true })).toBe(true);
  });

  it.each<[string, unknown]>([
    ["false", false],
    ["undefined", undefined],
    ["null", null],
    ['the string "true"', "true"],
    ["the number 1", 1],
    ["an object", {}],
  ])("does not index a profile whose indexable is %s", (_label, value) => {
    expect(profileIsIndexable({ indexable: value } as { indexable?: boolean })).toBe(false);
  });

  it("does not index a profile with no indexable field at all", () => {
    expect(profileIsIndexable({})).toBe(false);
  });
});

describe("chunk", () => {
  it("returns no chunks for an empty list", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("splits an exact multiple into full chunks with no trailing empty one", () => {
    expect(chunk([1, 2, 3, 4, 5, 6], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("keeps a short final chunk", () => {
    expect(chunk([1, 2, 3, 4], 3)).toEqual([[1, 2, 3], [4]]);
  });

  it.each([0, -1])("throws a RangeError for size %p", (size) => {
    expect(() => chunk([1], size)).toThrow(RangeError);
  });
});

describe("MAX_URLS_PER_SITEMAP", () => {
  it("matches the sitemap protocol's 50,000-URL limit", () => {
    expect(MAX_URLS_PER_SITEMAP).toBe(50_000);
  });
});
