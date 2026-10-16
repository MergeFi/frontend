import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MergeFi",
    short_name: "MergeFi",
    description:
      "Fund open source work and track contributor rewards through MergeFi.",
    start_url: "/",
    display: "standalone",
    // Matching dark colours — the manifest paired a near-black splash
    // (#0a0a0f) with a near-white theme (#fbfbfd), so an installed app flashed
    // a dark splash into a white status bar (#695).
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    icons: [
      // Chrome's install criteria need a 192px icon + a maskable variant (a
      // maskable icon renders correctly inside Android's adaptive-icon mask
      // instead of letterboxing).
      {
        src: "/icon.png",
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
        src: "/icon.png",
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
