/**
 * End-to-end-ish coverage of the public profile route: the page's params
 * through the real fetcher down to a mocked fetch(). Mocking fetch rather
 * than @/lib/api is deliberate — the property under test is *how many* and
 * *which* requests a page view costs, which a mocked fetcher would hide.
 */

jest.mock("@/lib/config", () => ({
  API_BASE_URL: "http://api.test",
  GITHUB_OAUTH_URL: "http://api.test/auth/github",
  STELLAR_NETWORK: "TESTNET",
}));

// The real notFound() throws to halt rendering; mirror that so the page
// can't accidentally continue past it.
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import ReputationPage from "./page";

/** A handle with no entry in mockReputationProfiles, so nothing masks a 404. */
const UNKNOWN_HANDLE = "definitely-not-a-contributor";

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("ReputationPage", () => {
  it("triggers notFound() for an unknown handle without fetching the user table", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    await expect(
      ReputationPage({ params: Promise.resolve({ handle: UNKNOWN_HANDLE }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(UNKNOWN_HANDLE);
  });

  it("renders a live profile from the scoped lookup", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { username: "priyaeth", avatarUrl: null },
        snapshot: {
          totalEarnings: "8420.00",
          mergedPrCount: 61,
          completionRate: "94.0",
          avgReviewTimeHours: "14.0",
          onTimeDeliveryPercentage: "88.0",
          languages: { Rust: 12 },
          orgsContributedTo: ["stellar-labs"],
        },
      }),
    });

    render(await ReputationPage({ params: Promise.resolve({ handle: "priyaeth" }) }));

    expect(screen.getByRole("heading", { name: "@priyaeth" })).toBeInTheDocument();
    expect(screen.getByText("61")).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the mock profile when the backend is unreachable", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    render(await ReputationPage({ params: Promise.resolve({ handle: "priyaeth" }) }));

    expect(screen.getByRole("heading", { name: "@priyaeth" })).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
  });
});
