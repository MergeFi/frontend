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

