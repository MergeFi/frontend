/**
 * page.test.tsx — /reputation/[handle] metadata (#19)
 *
 * The policy: profile pages are noindex-by-default (they render real
 * GitHub identities beside lifetime earnings) while still passing link
 * equity (follow). Locks both the found and not-found metadata paths.
 */

import { generateMetadata } from "./page";
import { fetchReputationByUsername } from "@/lib/api";
import { mockReputationProfiles } from "@/lib/mock-data";

jest.mock("@/lib/api", () => ({
  fetchReputationByUsername: jest.fn(),
}));

const mockedFetch = fetchReputationByUsername as jest.MockedFunction<typeof fetchReputationByUsername>;

const someHandle = Object.values(mockReputationProfiles)[0]?.handle ?? "someone";

function withParams(handle: string) {
  return { params: Promise.resolve({ handle }) };
}

describe("reputation page metadata (#19 noindex-by-default)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks an existing profile noindex but follow", async () => {
    const fallback =
      Object.values(mockReputationProfiles).find((p) => p.handle.toLowerCase() === someHandle.toLowerCase()) ?? null;
    mockedFetch.mockResolvedValue({
      data: fallback ?? {
        handle: someHandle,
        mergedPRs: 12,
        languages: ["TypeScript"],
      },
      source: "mock",
    } as never);

    const meta = await generateMetadata(withParams(someHandle));
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.title).toContain(someHandle);
  });

  it("marks a missing profile noindex and nofollow", async () => {
    mockedFetch.mockResolvedValue({ data: null, source: "live" } as never);
    const meta = await generateMetadata(withParams("nobody-here"));
    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});
