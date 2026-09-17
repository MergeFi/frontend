/**
 * Tests for reputation/[handle]/page.tsx (#412).
 *
 * Covers:
 * - Case-insensitive mock profile fallback resolution in generateMetadata and default export (#245 regression guard).
 * - Metadata generation for resolved vs non-existent profiles.
 * - Empty state branches when organizations is empty ("No contributions recorded yet.").
 * - Empty state branches when languages is empty ("No data yet.").
 * - notFound() triggering when handle cannot be resolved.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import ReputationPage, { generateMetadata } from "./page";
import { fetchReputationByUsername } from "@/lib/api";
import type { ReputationProfile } from "@/types";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  fetchReputationByUsername: jest.fn(),
}));

const mockedNotFound = notFound as unknown as jest.Mock;
const mockedFetchReputationByUsername = fetchReputationByUsername as jest.Mock;

const mockProfile: ReputationProfile = {
  handle: "priyaeth",
  avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  lifetimeEarnings: 8420,
  mergedPRs: 61,
  completionRate: 0.94,
  avgReviewTimeHours: 14,
  onTimeDeliveryRate: 0.88,
  languages: ["Rust", "TypeScript", "Go"],
  organizations: ["stellar-labs", "mergefi"],
};

describe("ReputationPage (#412)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateMetadata", () => {
    it("returns profile title and description when profile resolves", async () => {
      mockedFetchReputationByUsername.mockResolvedValue({
        data: mockProfile,
        source: "live",
      });

      const meta = await generateMetadata({
        params: Promise.resolve({ handle: "priyaeth" }),
      });

      expect(meta.title).toBe("@priyaeth | MergeFi");
      expect(meta.description).toContain("61 merged PRs");
      expect(meta.description).toContain("Rust, TypeScript, Go");
      expect(meta.openGraph?.title).toBe("@priyaeth | MergeFi");
    });

    it("resolves case-insensitively using fallback in generateMetadata", async () => {
      mockedFetchReputationByUsername.mockImplementation(
        async (_handle: string, fallback: ReputationProfile | null) => {
          return { data: fallback, source: "mock" };
        },
      );

      const meta = await generateMetadata({
        params: Promise.resolve({ handle: "PRIYAETH" }),
      });

      expect(meta.title).toBe("@priyaeth | MergeFi");
      expect(mockedFetchReputationByUsername).toHaveBeenCalledWith(
        "PRIYAETH",
        expect.objectContaining({ handle: "priyaeth" }),
      );
    });

    it("returns 'Profile not found | MergeFi' when profile is null", async () => {
      mockedFetchReputationByUsername.mockResolvedValue({
        data: null,
        source: "mock",
      });

      const meta = await generateMetadata({
        params: Promise.resolve({ handle: "unknown_user" }),
      });

      expect(meta.title).toBe("Profile not found | MergeFi");
    });
  });

  describe("ReputationPage rendering", () => {
    it("renders profile handle, organizations, languages, and stats", async () => {
      mockedFetchReputationByUsername.mockResolvedValue({
        data: mockProfile,
        source: "live",
      });

      const jsx = await ReputationPage({
        params: Promise.resolve({ handle: "priyaeth" }),
      });
      render(jsx);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("@priyaeth");
      expect(screen.getByText("stellar-labs")).toBeInTheDocument();
      expect(screen.getByText("mergefi")).toBeInTheDocument();
      expect(screen.getByText("Rust")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Average review time: 14.0h")).toBeInTheDocument();
    });

    it("resolves case-insensitively with mock fallback for uppercase handle", async () => {
      mockedFetchReputationByUsername.mockImplementation(
        async (_handle: string, fallback: ReputationProfile | null) => {
          return { data: fallback, source: "mock" };
        },
      );

      const jsx = await ReputationPage({
        params: Promise.resolve({ handle: "PRIYAETH" }),
      });
      render(jsx);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("@priyaeth");
      expect(mockedFetchReputationByUsername).toHaveBeenCalledWith(
        "PRIYAETH",
        expect.objectContaining({ handle: "priyaeth" }),
      );
    });

    it("renders empty-state message when organizations array is empty", async () => {
      const emptyOrgsProfile: ReputationProfile = {
        ...mockProfile,
        organizations: [],
      };
      mockedFetchReputationByUsername.mockResolvedValue({
        data: emptyOrgsProfile,
        source: "live",
      });

      const jsx = await ReputationPage({
        params: Promise.resolve({ handle: "priyaeth" }),
      });
      render(jsx);

      expect(screen.getByText("No contributions recorded yet.")).toBeInTheDocument();
    });

    it("renders empty-state message when languages array is empty", async () => {
      const emptyLangsProfile: ReputationProfile = {
        ...mockProfile,
        languages: [],
      };
      mockedFetchReputationByUsername.mockResolvedValue({
        data: emptyLangsProfile,
        source: "live",
      });

      const jsx = await ReputationPage({
        params: Promise.resolve({ handle: "priyaeth" }),
      });
      render(jsx);

      expect(screen.getByText("No data yet.")).toBeInTheDocument();
    });

    it("calls notFound() when profile cannot be resolved", async () => {
      mockedFetchReputationByUsername.mockResolvedValue({
        data: null,
        source: "mock",
      });

      await ReputationPage({
        params: Promise.resolve({ handle: "non_existent_dev" }),
      });

      expect(mockedNotFound).toHaveBeenCalledTimes(1);
    });
  });
});
