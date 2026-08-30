/**
 * robots.test.ts
 *
 * #19: the crawler policy in robots.ts must stay consistent with the
 * sitemap — everything public allowed, private app surfaces disallowed,
 * and profile pages deliberately left to their own noindex metadata
 * rather than a disallow rule.
 */

import robots from "./robots";

describe("robots (#19 crawler policy)", () => {
  it("allows the public site and points at the sitemap", () => {
    const r = robots();
    expect(r.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toContain("/sitemap.xml");
  });

  it("keeps the authed surfaces disallowed", () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    const disallow: string[] = Array.isArray(rules.disallow)
      ? rules.disallow
      : rules.disallow
        ? [rules.disallow]
        : [];
    expect(disallow).toContain("/dashboard/");
    expect(disallow).toContain("/auth/callback");
  });

  it("does not disallow profile pages — noindex metadata owns that job (#19)", () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    const disallow: string[] = Array.isArray(rules.disallow)
      ? rules.disallow
      : rules.disallow
        ? [rules.disallow]
        : [];
    expect(disallow.some((d) => d.includes("/reputation"))).toBe(false);
  });
});
