/**
 * sitemap.test.ts
 *
 * Locks in the #19 indexability policy: profile handles never appear in
 * the sitemap (the pages are opt-in-nothing today — they render real
 * identities beside lifetime earnings), and the public routes stay listed
 * no matter what the backend returns.
 */

import { fetchBounties } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";
import type { Bounty } from "@/types";

jest.mock("@/lib/api", () => ({
  fetchBounties: jest.fn(),
}));

import sitemap from "./sitemap";
const mockedFetchBounties = fetchBounties as jest.MockedFunction<typeof fetchBounties>;

const urlList = async () => {
  const entries = await sitemap();
  return entries.map((e) => new URL(e.url).pathname);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedFetchBounties.mockResolvedValue({ data: mockBounties, source: "mock" });
});

describe("sitemap (#19 indexability policy)", () => {
  it("lists the public static routes and one path per bounty", async () => {
    const paths = await urlList();
    for (const p of ["/", "/issues", "/milestones", "/connect"]) {
      expect(paths).toContain(p);
    }
    expect(paths.filter((p) => p.startsWith("/issues/")).length).toBe(mockBounties.length);
  });

  it("never enumerates profile handles", async () => {
    const paths = await urlList();
    expect(paths.some((p) => p.startsWith("/reputation/"))).toBe(false);
  });

  it("still excludes profiles no matter what the backend returns", async () => {
    mockedFetchBounties.mockResolvedValue({ data: [] as Bounty[], source: "live" });
    const paths = await urlList();
    expect(paths.filter((p) => p.startsWith("/issues/")).length).toBe(0);
    expect(paths).toContain("/milestones");
    expect(paths.some((p) => p.startsWith("/reputation/"))).toBe(false);
  });

  it("encodes bounty ids so odd characters stay one path segment", async () => {
    mockedFetchBounties.mockResolvedValue({
      data: [{ id: "issue with space" } as unknown as Bounty],
      source: "live",
    });
    const paths = await urlList();
    expect(paths).toContain("/issues/issue%20with%20space");
  });
});
