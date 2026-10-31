import { render, screen } from "@testing-library/react";
import { fetchReputationByUsername } from "@/lib/api";
import ReputationPage, { generateMetadata } from "./page";
import { mockReputationProfiles } from "@/lib/mock-data";
import type { ReputationProfile } from "@/types";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("@/lib/api", () => ({ fetchReputationByUsername: jest.fn() }));
jest.mock("./ReputationProfileView", () => ({
  ReputationProfileView: ({ profile }: { profile: { handle: string } }) => (
    <div data-testid="profile-view">@{profile.handle}</div>
  ),
}));
jest.mock("./ReputationClientFallback", () => ({
  ReputationClientFallback: ({ handle }: { handle: string }) => (
    <div data-testid="client-fallback">fallback-@{handle}</div>
  ),
}));

const mockFetch = fetchReputationByUsername as jest.MockedFunction<
  typeof fetchReputationByUsername
>;

const meta = (handle: string) => generateMetadata({ params: Promise.resolve({ handle }) });
const sampleProfile = mockReputationProfiles["priyaeth"] as unknown as ReputationProfile;

describe("reputation page robots metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks a profile that has not opted in as noindex, nofollow", async () => {
    mockFetch.mockResolvedValue({
      data: { ...sampleProfile, indexable: false },
      source: "live",
    });

    expect((await meta("priyaeth")).robots).toEqual({ index: false, follow: false });
  });

  it("allows indexing for a profile that has opted in", async () => {
    mockFetch.mockResolvedValue({
      data: { ...sampleProfile, indexable: true },
      source: "live",
    });

    expect((await meta("priyaeth")).robots).toEqual({ index: true, follow: true });
  });

  it("treats a missing opt-in flag as not indexable", async () => {
    const withoutFlag = { ...sampleProfile } as Record<string, unknown>;
    delete withoutFlag.indexable;
    mockFetch.mockResolvedValue({ data: withoutFlag as unknown as ReputationProfile, source: "live" });

    expect((await meta("priyaeth")).robots).toEqual({ index: false, follow: false });
  });

  it("keeps the title and social metadata intact for a non-indexed profile", async () => {
    mockFetch.mockResolvedValue({
      data: { ...sampleProfile, indexable: false },
      source: "live",
    });

    const metadata = await meta("priyaeth");

    expect(metadata.title).toBe("@priyaeth | MergeFi");
    expect(metadata.openGraph?.title).toBe("@priyaeth | MergeFi");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("ReputationPage component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders ReputationProfileView when profile is returned by server fetch", async () => {
    mockFetch.mockResolvedValue({
      data: sampleProfile,
      source: "live",
    });

    const jsx = await ReputationPage({ params: Promise.resolve({ handle: "priyaeth" }) });
    render(jsx);

    expect(screen.getByTestId("profile-view")).toBeInTheDocument();
    expect(screen.getByText("@priyaeth")).toBeInTheDocument();
    expect(screen.queryByTestId("client-fallback")).not.toBeInTheDocument();
  });

  it("renders ReputationClientFallback when server fetch returns null", async () => {
    mockFetch.mockResolvedValue({
      data: null,
      source: "mock",
    });

    const jsx = await ReputationPage({ params: Promise.resolve({ handle: "unknown_user" }) });
    render(jsx);

    expect(screen.getByTestId("client-fallback")).toBeInTheDocument();
    expect(screen.getByText("fallback-@unknown_user")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-view")).not.toBeInTheDocument();
  });
});
