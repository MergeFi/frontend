import MarkdownIt from "markdown-it";
import xss from "xss";

type MarkdownContentProps = {
  value: string;
  preview?: boolean;
};

// GitHub issue bodies are untrusted input. Keep pathological descriptions
// from consuming excessive CPU during Markdown parsing and sanitization while
// allowing normal long issue descriptions to remain readable.
export const MAX_MARKDOWN_LENGTH = 64_000;
export const MAX_PREVIEW_MARKDOWN_LENGTH = 4_000;

const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
markdown.disable("image");

function truncateMarkdown(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  // Prefer a block boundary so we are less likely to cut through a link,
  // emphasis span, or fenced code block. Markdown-it still handles a partial
  // final block safely if a hostile body has no useful newline boundary.
  const blockEnd = value.lastIndexOf("\n\n", maxLength);
  const lineEnd = value.lastIndexOf("\n", maxLength);
  const cutAt = blockEnd >= maxLength * 0.75 ? blockEnd : lineEnd >= maxLength * 0.75 ? lineEnd : maxLength;

  return `${value.slice(0, cutAt).trimEnd()}\n\n_Content truncated for safety._`;
}

function removeMarkdownImages(value: string): string {
  // Do not turn an image into a clickable link when image rendering is
  // disabled. Keep only the author-provided alt text as inert content.
  return value.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
}

export function MarkdownContent({ value, preview = false }: MarkdownContentProps) {
  const input = removeMarkdownImages(
    truncateMarkdown(
    value,
    preview ? MAX_PREVIEW_MARKDOWN_LENGTH : MAX_MARKDOWN_LENGTH,
    ),
  );
  const rendered = xss(markdown.render(input));

  return (
    <div
      className={
        preview
          ? "markdown-content markdown-content--preview text-sm text-slate-500 dark:text-slate-400"
          : "markdown-content text-slate-600 dark:text-slate-300"
      }
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
