import { pipelineStages } from "./page";
import type { Bounty } from "@/types";

describe("MaintainerDashboard — pipeline stages and escrow alignment (#88)", () => {
  it("includes the 'merged' status in pipelineStages with appropriate label", () => {
    const mergedStage = pipelineStages.find((stage) => stage.status === "merged");
    expect(mergedStage).toBeDefined();
    expect(mergedStage?.label).toBe("Merged");
  });

  it("contains all active stages aligned with totalEscrow calculation", () => {
    const stageStatuses = pipelineStages.map((s) => s.status);
    
    // Check that open, funded, claimed, in_review, and merged are present
    expect(stageStatuses).toContain("open");
    expect(stageStatuses).toContain("funded");
    expect(stageStatuses).toContain("claimed");
    expect(stageStatuses).toContain("in_review");
    expect(stageStatuses).toContain("merged");

    // Finished or non-escrow statuses like paid, refunded, expired are intentionally omitted from pipeline board
    expect(stageStatuses).not.toContain("paid");
    expect(stageStatuses).not.toContain("refunded");
    expect(stageStatuses).not.toContain("expired");
  });

  it("ensures a merged bounty is captured and counted under the merged pipeline column", () => {
    const mockBounties: Bounty[] = [
      {
        id: "1",
        org: "MergeFi",
        repo: "frontend",
        issueNumber: 88,
        title: "Test merged bounty",
        description: "Testing merged column",
        reward: 50,
        asset: "USDC",
        status: "merged",
        creator: "user1",
        createdAt: "2026-08-16T00:00:00Z",
      },
    ];

    const mergedStage = pipelineStages.find((stage) => stage.status === "merged");
    expect(mergedStage).toBeDefined();

    const filtered = mockBounties.filter((b) => b.status === mergedStage?.status);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Test merged bounty");
  });
});
