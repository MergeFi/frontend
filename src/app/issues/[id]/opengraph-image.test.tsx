/**
 * opengraph-image.test.tsx (#923)
 *
 * The per-bounty share card must always produce an image: a thrown handler
 * leaves every share of that bounty with no card at all.
 */

import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { ImageResponse } from "next/og";
import { mockBounties } from "@/lib/mock-data";
import BountyOpenGraphImage, { size } from "./opengraph-image";

// ImageResponse needs the edge runtime's renderer; capture what it was given
// instead so the card's content can be asserted in jsdom.
jest.mock("next/og", () => ({
  ImageResponse: jest.fn().mockImplementation(function (
    this: { element: ReactElement; init: unknown },
    element: ReactElement,
    init: unknown,
  ) {
    this.element = element;
    this.init = init;
  }),
}));

type CapturedImage = { element: ReactElement; init: unknown };

const originalFetch = global.fetch;

function mockBackendBounty(title: string) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      id: "live-1",
      amount: "250",
      asset: "USDC",
      difficulty: "beginner",
      status: "in_review",
      deadline: null,
      escrowId: null,
      issue: { number: 7, title, repository: { owner: "mergefi", name: "frontend" } },
    }),
  }) as unknown as typeof fetch;
}

function mockBackendDown() {
  global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
}

async function renderCard(id: string) {
  const image = (await BountyOpenGraphImage({
    params: Promise.resolve({ id }),
  })) as unknown as CapturedImage;
  render(image.element);
  return image;
}

describe("BountyOpenGraphImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("returns an image for a known bounty", async () => {
    mockBackendBounty("Fix the escrow release bug");

    const image = await renderCard("live-1");

    expect(image).toBeInstanceOf(ImageResponse);
    expect(image.init).toBe(size);
    expect(screen.getByText("Fix the escrow release bug")).toBeInTheDocument();
    expect(screen.getByText("mergefi/frontend")).toBeInTheDocument();
    expect(screen.getByText("IN REVIEW")).toBeInTheDocument();
  });

  it("still returns an image when the fetch fails and there is no fallback", async () => {
    mockBackendDown();

    const image = await renderCard("does-not-exist");

    expect(image).toBeInstanceOf(ImageResponse);
    expect(screen.getByText("Bounty not found")).toBeInTheDocument();
  });

  it("falls back to the mock bounty when the fetch fails", async () => {
    mockBackendDown();
    const mock = mockBounties[0];

    await renderCard(mock.id);

    expect(screen.getByText(mock.title)).toBeInTheDocument();
  });

  it("truncates a long title instead of overflowing", async () => {
    const longTitle = "x".repeat(150);
    mockBackendBounty(longTitle);

    await renderCard("live-1");

    expect(screen.queryByText(longTitle)).not.toBeInTheDocument();
    expect(screen.getByText(`${"x".repeat(97)}...`)).toBeInTheDocument();
  });
});
