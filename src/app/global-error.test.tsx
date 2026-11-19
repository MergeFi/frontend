/**
 * @jest-environment node
 *
 * global-error.test.tsx (#919)
 *
 * global-error replaces the whole document, providers included, when the root
 * layout throws. So it must render with no providers mounted (anything that
 * calls useTheme/useLocale/formatCurrency would throw a second time and leave
 * a blank page), and it must render its own <html> and <body>. Rendered to
 * static markup in a node environment because jsdom cannot mount a second
 * <html> element inside its own document.
 */

import { renderToStaticMarkup } from "react-dom/server";
import GlobalError from "./global-error";

function render(error: Error) {
  return renderToStaticMarkup(<GlobalError error={error} reset={() => {}} />);
}

describe("GlobalError", () => {
  it("renders readable output with no providers mounted", () => {
    const markup = render(new Error("Root layout exploded"));

    expect(markup).toContain("Something went wrong");
    expect(markup).toContain("Unexpected error");
    expect(markup).toContain("Root layout exploded");
  });

  it("renders its own <html> and <body>", () => {
    const markup = render(new Error("x"));

    expect(markup).toContain('<html lang="en"');
    expect(markup).toContain("<body");
    expect(markup).toContain("</body>");
    expect(markup).toContain("</html>");
  });

  it("falls back to generic copy when the error has no message", () => {
    const markup = render(new Error(""));

    expect(markup).toContain("An unexpected error occurred. Please try again.");
  });

  it("offers a reset affordance wired to reset()", () => {
    const reset = jest.fn();
    const element = GlobalError({ error: new Error("x"), reset });
    const markup = renderToStaticMarkup(element);

    expect(markup).toContain(">Try again</button>");
    const findButton = (node: unknown): { props: { onClick: () => void } } | null => {
      if (!node || typeof node !== "object") return null;
      const el = node as { type?: unknown; props?: { children?: unknown; onClick?: () => void } };
      if (el.type === "button") return el as { props: { onClick: () => void } };
      const children = el.props?.children;
      for (const child of Array.isArray(children) ? children : [children]) {
        const found = findButton(child);
        if (found) return found;
      }
      return null;
    };
    findButton(element)?.props.onClick();

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
