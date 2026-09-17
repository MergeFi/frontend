/**
 * Button.test.tsx (#211, #421)
 *
 * Covers:
 * - `loading` prop: sets aria-busy, forces disabled, renders a spinner (#211).
 * - `variant` prop: applies corresponding styling classes (#421).
 * - `size` prop: applies corresponding padding and font-size classes (#421).
 * - Custom `className` composition (#421).
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

describe("Button — variant prop (#421)", () => {
  it("defaults to primary variant styling", () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByRole("button", { name: "Primary Button" });
    expect(button).toHaveClass("bg-slate-900");
    expect(button).toHaveClass("text-white");
  });

  it("applies secondary variant styling", () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole("button", { name: "Secondary Button" });
    expect(button).toHaveClass("bg-indigo-50");
    expect(button).toHaveClass("text-indigo-700");
  });

  it("applies ghost variant styling", () => {
    render(<Button variant="ghost">Ghost Button</Button>);
    const button = screen.getByRole("button", { name: "Ghost Button" });
    expect(button).toHaveClass("bg-transparent");
    expect(button).toHaveClass("text-slate-600");
  });

  it("applies outline variant styling", () => {
    render(<Button variant="outline">Outline Button</Button>);
    const button = screen.getByRole("button", { name: "Outline Button" });
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("border-slate-200");
    expect(button).toHaveClass("text-slate-800");
  });
});

describe("Button — size prop (#421)", () => {
  it("defaults to md size styling", () => {
    render(<Button>Medium Button</Button>);
    const button = screen.getByRole("button", { name: "Medium Button" });
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("py-2");
    expect(button).toHaveClass("text-sm");
  });

  it("applies sm size styling", () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole("button", { name: "Small Button" });
    expect(button).toHaveClass("px-3");
    expect(button).toHaveClass("py-1.5");
    expect(button).toHaveClass("text-sm");
  });

  it("applies lg size styling", () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole("button", { name: "Large Button" });
    expect(button).toHaveClass("px-6");
    expect(button).toHaveClass("py-3");
    expect(button).toHaveClass("text-base");
  });
});

describe("Button — className composition (#421)", () => {
  it("merges custom className with base, variant, and size classes", () => {
    render(<Button className="custom-test-class">Custom Class Button</Button>);
    const button = screen.getByRole("button", { name: "Custom Class Button" });
    expect(button).toHaveClass("custom-test-class");
    expect(button).toHaveClass("bg-slate-900");
    expect(button).toHaveClass("px-4");
  });
});
