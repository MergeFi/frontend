import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MergeFi | Merge code. Earn instantly.",
    short_name: "MergeFi",
    description:
      "Financial infrastructure for open source: fund GitHub issues, escrow payment with Soroban smart contracts on Stellar, and pay contributors automatically when work is merged.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfd",
    theme_color: "#0a0a0f",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
