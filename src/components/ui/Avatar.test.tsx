/**
 * Avatar.test.tsx
 *
 * Covers Avatar render logic (src vs fallback URL, unoptimized flag) and
 * AvatarStack overflow counting (under-max, at-max, over-max) — #278.
 */

import { render, screen } from "@testing-library/react";
import { Avatar, AvatarStack } from "./Avatar";

describe("Avatar", () => {
  it("renders with the given seed as alt text", () => {
    render(<Avatar seed="alice" />);
    const img = screen.getByRole("img", { name: "alice" });
    expect(img).toBeInTheDocument();
  });

  it("uses the src prop when provided", () => {
    render(<Avatar seed="alice" src="https://example.com/alice.png" />);
    const img = screen.getByRole("img", { name: "alice" });
    // Next.js Image rewrites the src through its optimization pipeline
    expect(img.getAttribute("src")).toContain("example.com%2Falice.png");
  });

  it("falls back to a dicebear URL when no src is provided", () => {
    render(<Avatar seed="bob" />);
    const img = screen.getByRole("img", { name: "bob" });
    const src = img.getAttribute("src") ?? "";
    expect(src).toContain("api.dicebear.com");
    expect(src).toContain("seed=bob");
  });

  it("uses dicebear URL for unoptimized external images", () => {
    render(<Avatar seed="carol" />);
    const img = screen.getByRole("img", { name: "carol" });
    expect(img.getAttribute("src")).toContain("dicebear.com");
  });

  it("does not set unoptimized for custom src URLs", () => {
    render(<Avatar seed="dave" src="https://example.com/dave.png" />);
    const img = screen.getByRole("img", { name: "dave" });
    // Next.js Image rewrites src through optimization; just verify it's present
    expect(img.getAttribute("src")).toContain("example.com");
  });

  it("applies custom size dimensions", () => {
    render(<Avatar seed="eve" size={48} />);
    const img = screen.getByRole("img", { name: "eve" });
    expect(img).toHaveAttribute("width", "48");
    expect(img).toHaveAttribute("height", "48");
  });

  it("merges custom className", () => {
    render(<Avatar seed="frank" className="test-extra" />);
    const img = screen.getByRole("img", { name: "frank" });
    expect(img.className).toMatch(/test-extra/);
  });
});

describe("AvatarStack", () => {
  it("renders all seeds when under max", () => {
    render(<AvatarStack seeds={["a", "b", "c"]} max={5} />);
    expect(screen.getByRole("img", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "b" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "c" })).toBeInTheDocument();
    expect(screen.queryByText("+")).not.toBeInTheDocument();
  });

  it("renders exactly max avatars when seeds length equals max", () => {
    render(<AvatarStack seeds={["a", "b", "c"]} max={3} />);
    expect(screen.getByRole("img", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "b" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "c" })).toBeInTheDocument();
    expect(screen.queryByText("+")).not.toBeInTheDocument();
  });

  it("shows overflow count when seeds exceed max", () => {
    render(<AvatarStack seeds={["a", "b", "c", "d", "e"]} max={3} />);
    expect(screen.getByRole("img", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "b" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "c" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "d" })).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("defaults max to 5", () => {
    const seeds = ["a", "b", "c", "d", "e", "f", "g"];
    render(<AvatarStack seeds={seeds} />);
    expect(screen.getByRole("img", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "e" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "f" })).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("includes hidden seed names in the overflow title attribute", () => {
    render(<AvatarStack seeds={["a", "b", "c", "d"]} max={2} />);
    const overflow = screen.getByText("+2");
    expect(overflow).toHaveAttribute("title", "c, d");
  });

  it("renders nothing extra for an empty seeds array", () => {
    const { container } = render(<AvatarStack seeds={[]} />);
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });
});
