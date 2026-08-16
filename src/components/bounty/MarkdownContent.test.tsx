import { render, screen } from "@testing-library/react";
import {
  MarkdownContent,
  MAX_MARKDOWN_LENGTH,
  MAX_PREVIEW_MARKDOWN_LENGTH,
} from "./MarkdownContent";

describe("MarkdownContent", () => {
  it("renders common Markdown as readable content", () => {
    render(<MarkdownContent value={"**Bold**\n\n`code`\n\n- item"} />);

    expect(screen.getByText("Bold").tagName).toBe("STRONG");
    expect(screen.getByText("code")).toBeInTheDocument();
    expect(screen.getByText("item")).toBeInTheDocument();
  });

  it("sanitizes HTML event handlers and javascript links", () => {
    const { container } = render(
      <MarkdownContent
        value={'<img src="x" onerror="alert(1)" />\n\n[click](javascript:alert(1))'}
      />,
    );

    expect(container.querySelector("img[onerror]")).not.toBeInTheDocument();
    expect(container.querySelector('a[href^="javascript:"]')).not.toBeInTheDocument();
  });

  it("does not load remote images from untrusted issue bodies", () => {
    const { container } = render(
      <MarkdownContent value={'![tracking pixel](https://example.com/pixel.gif)'} />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector('a[href="https://example.com/pixel.gif"]')).not.toBeInTheDocument();
    expect(container).toHaveTextContent("tracking pixel");
  });

  it("bounds pathological input before parsing", () => {
    const { container } = render(<MarkdownContent value={"x".repeat(100_000)} />);
    expect(container.textContent?.length).toBeLessThanOrEqual(MAX_MARKDOWN_LENGTH + 60);
    expect(container).toHaveTextContent("Content truncated for safety.");
  });

  it("uses a smaller bound for card previews", () => {
    const { container } = render(
      <MarkdownContent preview value={"x".repeat(20_000)} />,
    );

    expect(container.textContent?.length).toBeLessThanOrEqual(
      MAX_PREVIEW_MARKDOWN_LENGTH + 60,
    );
  });
});
