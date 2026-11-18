/**
 * Tests for stripMarkdownToPlainText (#89).
 *
 * Used by BountyCard's line-clamp-2 preview so a markdown-containing
 * description doesn't show a truncated fragment of literal, mid-syntax
 * markdown (e.g. "Use `**config" cut mid-token).
 */

import { stripMarkdownToPlainText } from "./markdown";

describe("stripMarkdownToPlainText", () => {
  it("strips bold, italic, and inline code", () => {
    expect(stripMarkdownToPlainText("Use **bold**, *italic*, and `code`.")).toBe(
      "Use bold, italic, and code.",
    );
  });

  it("keeps link text and drops the URL", () => {
    expect(
      stripMarkdownToPlainText("See [the docs](https://example.com/docs) for details."),
    ).toBe("See the docs for details.");
  });

  it("drops images entirely", () => {
    expect(stripMarkdownToPlainText("Before ![a screenshot](https://x.png) after")).toBe(
      "Before after",
    );
  });

  it("unwraps fenced code blocks to their inner content", () => {
    const input = "Repro:\n```js\nconst x = 1;\n```\nThanks";
    expect(stripMarkdownToPlainText(input)).toBe("Repro: const x = 1; Thanks");
  });

  it("strips an unterminated fence marker instead of leaving ``` visible (#199)", () => {
    const input = "Repro:\n```bash\nnpm install\nsome output";
    const result = stripMarkdownToPlainText(input);
    expect(result).not.toContain("```");
    expect(result).toBe("Repro: npm install some output");
  });

  it("strips heading markers", () => {
    expect(stripMarkdownToPlainText("## Steps to reproduce")).toBe("Steps to reproduce");
  });

  it("strips list markers from bullet and numbered lists", () => {
    const input = "- first\n- second\n1. one\n2. two";
    expect(stripMarkdownToPlainText(input)).toBe("first second one two");
  });

  it("strips GFM task-list checkboxes instead of leaving '[ ]'/'[x]' visible (#682)", () => {
    const input = "- [ ] Add tests\n- [x] Fix the bug\n* [X] Docs pass";
    expect(stripMarkdownToPlainText(input)).toBe("Add tests Fix the bug Docs pass");
  });

  it("drops GFM table separator rows and replaces pipes with spaces (#682)", () => {
    const input = "| Name | Status |\n|------|--------|\n| alice | paid |\n| bob | claimed |";
    expect(stripMarkdownToPlainText(input)).toBe("Name Status alice paid bob claimed");
  });

  it("handles table separator rows with alignment colons", () => {
    const input = "| Left | Right |\n| :--- | ----: |\n| a | b |";
    expect(stripMarkdownToPlainText(input)).toBe("Left Right a b");
  });

  it("keeps table cell content readable when the table is the whole body", () => {
    const result = stripMarkdownToPlainText("| col1 | col2 |\n|-|-|\n| 1 | 2 |");
    expect(result).not.toContain("|");
    expect(result).toBe("col1 col2 1 2");
  });

  it("strips blockquote markers", () => {
    expect(stripMarkdownToPlainText("> quoted text")).toBe("quoted text");
  });

  it("strips strikethrough", () => {
    expect(stripMarkdownToPlainText("~~deprecated~~ replaced")).toBe("deprecated replaced");
  });

  it("produces clean plain text for a description with markdown near the truncation boundary", () => {
    // Simulates BountyCard's line-clamp-2 scenario: the raw markdown, if
    // shown verbatim and cut off by the CSS clamp, would end mid-syntax
    // (e.g. "...crashes when calling `getBalance" with an unclosed
    // backtick). The stripped plain text has no such artifact anywhere in
    // it, so truncating it at any point is always safe.
    const input =
      "The `getBalance()` method throws when the account is unfunded — see " +
      "[issue #12](https://github.com/org/repo/issues/12) for the original report.";
    const result = stripMarkdownToPlainText(input);
    // No markdown syntax markers survive — backticks, asterisks/underscores
    // for emphasis, or link-bracket syntax. (Literal parentheses from
    // "getBalance()" in the source prose are expected to remain — they're
    // real content, not markdown syntax.)
    expect(result).not.toMatch(/[`*_[\]]/);
    expect(result).toBe(
      "The getBalance() method throws when the account is unfunded — see issue #12 for the original report.",
    );
  });

  it("passes plain text through unchanged", () => {
    expect(stripMarkdownToPlainText("Just a normal sentence.")).toBe(
      "Just a normal sentence.",
    );
  });

  it("collapses newlines into single spaces for inline flow", () => {
    expect(stripMarkdownToPlainText("Line one\n\nLine two\nLine three")).toBe(
      "Line one Line two Line three",
    );
  });

  // #901 — the remaining GitHub-issue constructs that leaked into previews.
  it("strips raw HTML tags and comments, keeping their text", () => {
    expect(
      stripMarkdownToPlainText(
        "Crash on save<br>\n<details><summary>Logs</summary>stack trace</details><!-- hidden -->",
      ),
    ).toBe("Crash on save Logsstack trace");
  });

  it("drops an <img> tag entirely", () => {
    expect(stripMarkdownToPlainText('Before <img src="https://x.png" alt="x"> after')).toBe(
      "Before after",
    );
  });

  it("leaves comparison operators in prose alone", () => {
    expect(stripMarkdownToPlainText("Fails when a < b and c > d")).toBe(
      "Fails when a < b and c > d",
    );
  });

  it("unwraps an autolink to its URL", () => {
    expect(stripMarkdownToPlainText("See <https://example.com/issue/1> for context")).toBe(
      "See https://example.com/issue/1 for context",
    );
  });

  it("keeps reference-style link text and drops the definition line", () => {
    expect(
      stripMarkdownToPlainText(
        "Read [the docs][docs] and [the FAQ][].\n\n[docs]: https://example.com/docs\n[the FAQ]: https://example.com/faq",
      ),
    ).toBe("Read the docs and the FAQ.");
  });

  it("drops reference-style images", () => {
    expect(stripMarkdownToPlainText("Before ![shot][img] after\n\n[img]: https://x.png")).toBe(
      "Before after",
    );
  });
});
