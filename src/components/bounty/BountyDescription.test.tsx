/**
 * Tests for BountyDescription (#89).
 *
 * bounty.description is raw, untrusted, third-party GitHub issue Markdown
 * with no backend sanitization guaranteed anywhere in this pipeline. These
 * tests cover both halves of the issue: (a) real GFM content renders as
 * actual formatted elements, not raw syntax, and (b) HTML/script injection
 * attempts embedded in that markdown render completely inertly.
 */

import { render, screen } from "@testing-library/react";
import { BountyDescription } from "./BountyDescription";

describe("BountyDescription — content fidelity", () => {
  it("renders a fenced code block as a <pre><code> element, not raw ``` syntax", () => {
    const description = "Steps:\n```js\nconst x = getBalance();\n```";
    render(<BountyDescription description={description} />);

    expect(screen.queryByText(/```/)).not.toBeInTheDocument();
    const code = screen.getByText((content) => content.includes("getBalance()"));
    expect(code.tagName.toLowerCase()).toBe("code");
    expect(code.closest("pre")).toBeInTheDocument();
  });

  it("renders a markdown link as a real <a> element with the correct href", () => {
    render(
      <BountyDescription description="See [the docs](https://example.com/docs) for details." />,
    );

    const link = screen.getByRole("link", { name: "the docs" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    // Raw markdown link syntax must not appear literally in the output.
    expect(screen.queryByText(/\[the docs\]/)).not.toBeInTheDocument();
  });

  it("renders bold text as a <strong> element, not literal asterisks", () => {
    render(<BountyDescription description="This is **important** context." />);

    const strong = screen.getByText("important");
    expect(strong.tagName.toLowerCase()).toBe("strong");
    expect(screen.queryByText(/\*\*important\*\*/)).not.toBeInTheDocument();
  });

  it("renders a bullet list as real <ul><li> elements", () => {
    render(<BountyDescription description={"- first step\n- second step"} />);

    expect(screen.getByText("first step").closest("li")).toBeInTheDocument();
    expect(screen.getByText("second step").closest("li")).toBeInTheDocument();
  });
});

describe("BountyDescription — untrusted-content hardening", () => {
  it("renders an embedded <img onerror> payload inertly, with no onerror attribute ever mounted", () => {
    (window as unknown as { __xss?: number }).__xss = undefined;
    const payload = 'Ignore this: <img src=x onerror="window.__xss=1">';

    const { container } = render(<BountyDescription description={payload} />);

    // No <img> element with an onerror handler was ever created — the raw
    // HTML tag must render as inert literal text, not a real DOM element.
    const img = container.querySelector("img[onerror]");
    expect(img).toBeNull();
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });

  it("neutralizes a javascript: URL in a markdown link rather than passing it through to href", () => {
    render(<BountyDescription description="[click me](javascript:alert(1))" />);

    const link = screen.queryByRole("link", { name: "click me" });
    if (link) {
      const href = link.getAttribute("href") ?? "";
      expect(href.toLowerCase().startsWith("javascript:")).toBe(false);
    }
    // Whether rendered as a neutralized link or plain text, the dangerous
    // scheme must never reach a real, clickable href in the DOM.
    expect(document.querySelector('a[href^="javascript:" i]')).toBeNull();
  });

  it("renders a raw <script> tag embedded in the markdown as inert text, never as an executable script element", () => {
    const payload = 'Notes: <script>window.__xss = 1;</script> end';
    (window as unknown as { __xss?: number }).__xss = undefined;

    const { container } = render(<BountyDescription description={payload} />);

    expect(container.querySelector("script")).toBeNull();
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });
});
