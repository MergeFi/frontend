/**
 * not-found.test.tsx (#921)
 *
 * The 404 page is what every unknown URL lands on, so it must render with no
 * context providers around it and must never link to a route that is itself
 * a 404 (#836 found a CTA pointing at a missing /settings).
 */

import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import NotFound, { metadata } from "./not-found";

/** True when `href` maps to a `page.tsx` under src/app. */
function routeExists(href: string): boolean {
  const pathname = href.split(/[?#]/)[0];
  const segments = pathname.split("/").filter(Boolean);
  return fs.existsSync(path.join(__dirname, ...segments, "page.tsx"));
}

describe("NotFound", () => {
  it("renders the 404 copy without any providers", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/doesn.t exist or may have moved/),
    ).toBeInTheDocument();
  });

  it("links back to home", () => {
    render(<NotFound />);

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("only links to routes that exist in src/app", () => {
    const { container } = render(<NotFound />);
    const hrefs = Array.from(container.querySelectorAll("a[href]")).map(
      (a) => a.getAttribute("href") as string,
    );

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect({ href, exists: routeExists(href) }).toEqual({ href, exists: true });
    }
  });

  it("is excluded from search indexing", () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
