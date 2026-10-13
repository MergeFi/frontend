import manifest from "./manifest";

describe("web app manifest", () => {
  it("provides standalone MergeFi install metadata and app icons", () => {
    expect(manifest()).toMatchObject({
      name: "MergeFi",
      short_name: "MergeFi",
      start_url: "/",
      display: "standalone",
      background_color: "#0a0a0f",
      theme_color: "#0a0a0f",
      icons: expect.arrayContaining([
        expect.objectContaining({ src: "/icon-192.png", sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ src: "/icon.png", sizes: "512x512", purpose: "any" }),
        expect.objectContaining({
          src: "/icon-maskable-512.png",
          sizes: "512x512",
          purpose: "maskable",
        }),
        expect.objectContaining({ src: "/apple-icon.png", sizes: "180x180" }),
      ]),
    });
  });

  it("does not flash a mismatched status bar color on install (#695)", () => {
    // background_color and theme_color render on the same splash screen, so
    // they must agree with each other -- unlike layout.tsx's dark/light
    // themeColor pair, which only ever applies one at a time via a media
    // query.
    expect(manifest().background_color).toBe(manifest().theme_color);
  });

  it("includes a maskable icon within Chrome's install safe-zone requirements", () => {
    const maskable = manifest().icons?.find((icon) => icon.purpose === "maskable");
    expect(maskable).toBeDefined();
    expect(maskable?.sizes).toBe("512x512");
  });

  it("includes the 192px icon size Chrome's install criteria require", () => {
    const has192 = manifest().icons?.some((icon) => icon.sizes === "192x192");
    expect(has192).toBe(true);
  });
});
