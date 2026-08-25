/**
 * Button.test.tsx (#211)
 *
 * Covers the `loading` prop: it should set aria-busy, force disabled
 * (even when `disabled` isn't separately passed), and render a spinner —
 * standardizing the pattern every async-action call site previously
 * reimplemented independently with no aria-busy at all.
 */

import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button — loading prop", () => {
  it("is not busy or disabled by default", () => {
    render(<Button>Fund this bounty</Button>);
    const button = screen.getByRole("button", { name: "Fund this bounty" });
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button).not.toBeDisabled();
  });

  it("sets aria-busy and disables the button when loading", () => {
    render(<Button loading>Confirming in wallet...</Button>);
    const button = screen.getByRole("button", { name: /Confirming in wallet/ });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
  });

  it("renders a spinner when loading", () => {
    const { container } = render(<Button loading>Claiming...</Button>);
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("renders no spinner when not loading", () => {
    const { container } = render(<Button>Claim this issue</Button>);
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("stays disabled when explicitly disabled, independent of loading", () => {
    render(<Button disabled>No action available</Button>);
    const button = screen.getByRole("button", { name: "No action available" });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });
});
