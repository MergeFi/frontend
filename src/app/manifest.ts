import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MergeFi",
    short_name: "MergeFi",
    description:
      "Fund open source work and track contributor rewards through MergeFi.",
    start_url: "/",
    display: "standalone",
    // A manifest can only hold one static pair, unlike layout.tsx's
    // `viewport.themeColor`, which picks light vs. dark via a media query
    // (#224). "#fbfbfd" is that light-mode value; using it here paired with
    // a dark background_color made the install splash flash a dark screen
    // into a near-white status bar. Both values now match the dark-mode-
    // first design background_color already used (#695).
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
