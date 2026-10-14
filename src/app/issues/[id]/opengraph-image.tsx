import { ImageResponse } from "next/og";
import { fetchBounty } from "@/lib/api";
import { mockBounties } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export const alt = "MergeFi bounty";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Per-bounty OG image — a shared bounty link shows its reward, org/repo, and
 * title instead of the generic MergeFi card (#696). Every satori element has
 * an explicit display + single-children (the same constraint noted in
 * social-image.tsx).
 */
export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: bounty } = await fetchBounty(
    id,
    mockBounties.find((b) => b.id === id),
  );

  const reward = bounty
    ? formatCurrency(bounty.reward, bounty.asset)
    : "";
  const repoLine = bounty ? `${bounty.org}/${bounty.repo} #${bounty.issueNumber}` : "";
  const title = bounty?.title ?? "Fund or claim this bounty";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0a0a0f",
        color: "#ffffff",
        padding: "72px",
        fontFamily: "Arial",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div
          style={{
            display: "flex",
            width: "44px",
            height: "44px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            backgroundColor: "#a3e635",
            color: "#0a0a0f",
            fontSize: "27px",
            fontWeight: 700,
          }}
        >
          M
        </div>
        <span style={{ fontSize: "28px", fontWeight: 700 }}>MergeFi</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", fontSize: "26px", color: "#9ca3af" }}>
          {repoLine}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "54px",
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            fontSize: "48px",
            fontWeight: 700,
            color: "#a3e635",
          }}
        >
          {reward}
        </div>
        <div style={{ display: "flex", fontSize: "24px", color: "#9ca3af" }}>
          bounty
        </div>
      </div>
    </div>,
    { ...size },
  );
}
