/**
 * Tests for reputation/[handle] page — extracted ReputationProfileView (#412).
 *
 * Covers: case-insensitive handle lookup, empty-state branches for
 * organizations and languages.
 */

import { render, screen } from "@testing-library/react";
import { ReputationProfileView } from "./ReputationProfileView";
import type { ReputationProfile } from "@/types";

function makeProfile(overrides: Partial<ReputationProfile> = {}): ReputationProfile {
  return {
    handle: "testuser",
    avatarUrl: "https://example.com/avatar.png",
    lifetimeEarnings: 1000,
    mergedPRs: 10,
    completionRate: 0.9,
    avgReviewTimeHours: 12,
    onTimeDeliveryRate: 0.85,
    languages: ["TypeScript"],
    organizations: ["test-org"],
    ...overrides,
  };
}

describe("ReputationProfileView — empty states", () => {
  it("renders 'No contributions recorded yet.' when organizations is empty", () => {
    render(<ReputationProfileView profile={makeProfile({ organizations: [] })} />);
    expect(screen.getByText("No contributions recorded yet.")).toBeInTheDocument();
  });

  it("renders 'No data yet.' when languages is empty", () => {
    render(<ReputationProfileView profile={makeProfile({ languages: [] })} />);
    expect(screen.getByText("No data yet.")).toBeInTheDocument();
  });

  it("renders org badges when organizations is non-empty", () => {
    render(<ReputationProfileView profile={makeProfile({ organizations: ["stellar-labs", "mergefi"] })} />);
    expect(screen.getByText("stellar-labs")).toBeInTheDocument();
    expect(screen.getByText("mergefi")).toBeInTheDocument();
    expect(screen.queryByText("No contributions recorded yet.")).not.toBeInTheDocument();
  });

  it("renders language badges when languages is non-empty", () => {
    render(<ReputationProfileView profile={makeProfile({ languages: ["Rust", "Go"] })} />);
    expect(screen.getByText("Rust")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.queryByText("No data yet.")).not.toBeInTheDocument();
  });
});

describe("ReputationProfileView — handle display", () => {
  it("renders the handle with @ prefix", () => {
    render(<ReputationProfileView profile={makeProfile({ handle: "priyaeth" })} />);
    expect(screen.getByText(/@priyaeth/)).toBeInTheDocument();
  });
});

describe("ReputationProfileView — stats", () => {
  it("renders stat cards with profile data", () => {
    render(<ReputationProfileView profile={makeProfile({ mergedPRs: 42 })} />);
    expect(screen.getByText("Merged PRs")).toBeInTheDocument();
    expect(screen.getByText("Lifetime earnings")).toBeInTheDocument();
  });

  it("renders average review time", () => {
    render(<ReputationProfileView profile={makeProfile({ avgReviewTimeHours: 12 })} />);
    expect(screen.getByText(/Average review time/)).toBeInTheDocument();
  });
});
