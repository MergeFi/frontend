import { identiconDataUri, identiconSvg } from "./identicon";

describe("identicon (#929)", () => {
  it("is deterministic for the same seed", () => {
    expect(identiconSvg("alice")).toBe(identiconSvg("alice"));
  });

  it("differs between seeds", () => {
    expect(identiconSvg("alice")).not.toBe(identiconSvg("bob"));
  });

  it("is horizontally symmetric", () => {
    const svg = identiconSvg("symmetry-check");
    const cells = [...svg.matchAll(/<rect x="(\d)" y="(\d)" width="1"/g)].map(
      ([, x, y]) => `${x},${y}`,
    );
    for (const cell of cells) {
      const [x, y] = cell.split(",").map(Number);
      expect(cells).toContain(`${4 - x},${y}`);
    }
  });

  it("is a local data: URI that never references a third-party host or leaks the seed", () => {
    const uri = identiconDataUri("private-handle");
    expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
    expect(uri).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
    expect(decodeURIComponent(uri)).not.toContain("private-handle");
  });

  it("contains no script or event-handler content", () => {
    const svg = identiconSvg("<script>alert(1)</script>");
    expect(svg).not.toMatch(/<script|on\w+=/i);
  });
});
