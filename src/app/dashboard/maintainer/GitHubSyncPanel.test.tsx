/**
 * GitHubSyncPanel.test.tsx (#915)
 *
 * Pins the request the panel's only action sends — exact path, method and
 * pagination — so a wrong endpoint (#831) shows up as a failing test, and
 * covers the error and success states.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { GitHubSyncPanel } from "./GitHubSyncPanel";

const originalFetch = global.fetch;

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

function fillAndSync(owner: string, repo: string) {
  fireEvent.change(screen.getByLabelText("Repository owner"), { target: { value: owner } });
  fireEvent.change(screen.getByLabelText("Repository name"), { target: { value: repo } });
  fireEvent.click(screen.getByRole("button", { name: /sync issues/i }));
}

describe("GitHubSyncPanel", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("keeps the sync button disabled until owner and repo are filled", () => {
    render(<GitHubSyncPanel />);
    const button = screen.getByRole("button", { name: /sync issues/i });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Repository owner"), { target: { value: "mergefi" } });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Repository name"), { target: { value: "frontend" } });
    expect(button).toBeEnabled();
  });

  it("POSTs to the sync endpoint for the trimmed, encoded owner/repo", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ synced: 3 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<GitHubSyncPanel />);

    fillAndSync("  merge fi ", " frontend ");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Synced 3 issues from merge fi/frontend",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/github/sync/merge%20fi/frontend", {
      method: "POST",
    });
  });

  it("follows nextPage until the sync is complete and totals the result", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ synced: 2, nextPage: "abc" }))
      .mockResolvedValueOnce(jsonResponse({ synced: 5 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<GitHubSyncPanel />);

    fillAndSync("mergefi", "frontend");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Synced 7 issues from mergefi/frontend",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/github/sync/mergefi/frontend?nextPage=abc", {
      method: "POST",
    });
    expect(screen.getByText("mergefi/frontend")).toBeInTheDocument();
    expect(screen.getByText("7 issues")).toBeInTheDocument();
    expect(screen.getByLabelText("Open mergefi/frontend on GitHub")).toHaveAttribute(
      "href",
      "https://github.com/mergefi/frontend",
    );
  });

  it("shows the backend's error message when the request fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ error: "Repository not found" }, false, 404)) as unknown as typeof fetch;
    render(<GitHubSyncPanel />);

    fillAndSync("mergefi", "missing");

    expect(await screen.findByRole("status")).toHaveTextContent("Repository not found");
    expect(screen.queryByText("Synced repositories")).not.toBeInTheDocument();
  });

  it("falls back to the status code when the error body is not JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    }) as unknown as typeof fetch;
    render(<GitHubSyncPanel />);

    fillAndSync("mergefi", "frontend");

    expect(await screen.findByRole("status")).toHaveTextContent("Sync failed (500)");
  });

  it("shows a generic message when the request itself rejects", async () => {
    global.fetch = jest.fn().mockRejectedValue("offline") as unknown as typeof fetch;
    render(<GitHubSyncPanel />);

    fillAndSync("mergefi", "frontend");

    expect(await screen.findByRole("status")).toHaveTextContent("Sync failed");
  });
});
