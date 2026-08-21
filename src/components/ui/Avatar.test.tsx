import React from "react";
import { render, screen } from "@testing-library/react";
import { Avatar, AvatarStack } from "./Avatar";

// Mock next/image to verify rendered attributes straightforwardly
jest.mock("next/image", () => {
  return function DummyImage(props: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt} src={props.src} width={props.width} height={props.height} className={props.className} data-unoptimized={props.unoptimized ? "true" : "false"} />;
  };
});

describe("Avatar component (#278)", () => {
  it("constructs dicebear URL with seed when src is not provided", () => {
    render(<Avatar seed="alice" />);
    const img = screen.getByRole("img", { name: "alice" });
    expect(img).toHaveAttribute("src", "https://api.dicebear.com/9.x/identicon/svg?seed=alice&backgroundType=gradientLinear");
    expect(img).toHaveAttribute("data-unoptimized", "true");
  });

  it("uses provided src when specified", () => {
    render(<Avatar seed="alice" src="https://example.com/avatar.png" />);
    const img = screen.getByRole("img", { name: "alice" });
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
    expect(img).toHaveAttribute("data-unoptimized", "false");
  });
});

describe("AvatarStack component (#278)", () => {
  it("renders all avatars and no overflow badge when seeds count is less than max", () => {
    const seeds = ["alice", "bob", "carol"];
    render(<AvatarStack seeds={seeds} max={5} />);

    expect(screen.getByRole("img", { name: "alice" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "bob" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "carol" })).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("renders all avatars and no overflow badge when seeds count equals max", () => {
    const seeds = ["a", "b", "c", "d", "e"];
    render(<AvatarStack seeds={seeds} max={5} />);

    expect(screen.getAllByRole("img")).toHaveLength(5);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("renders max avatars and exact overflow badge '+N' when seeds count exceeds max", () => {
    const seeds = ["a", "b", "c", "d", "e", "f", "g"];
    render(<AvatarStack seeds={seeds} max={5} />);

    expect(screen.getAllByRole("img")).toHaveLength(5);
    const overflow = screen.getByText("+2");
    expect(overflow).toBeInTheDocument();
  });
});
