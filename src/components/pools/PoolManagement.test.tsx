/**
 * PoolManagement.test.tsx (#918)
 *
 * Covers maintenance-pool creation and reward assignment: both are money
 * paths, so each request must carry an idempotency key, and a failed request
 * must render an error rather than reject unhandled.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssignRewardButton, CreatePoolButton } from "./PoolManagement";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const mockApiPost = jest.fn();
jest.mock("@/lib/api", () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}));

describe("CreatePoolButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function openForm() {
    fireEvent.click(screen.getByRole("button", { name: "Create pool" }));
  }

  it("requires a pool name before sending anything", () => {
    render(<CreatePoolButton org="mergefi" repo="frontend" />);
    openForm();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByText("Pool name is required.")).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("creates a pool with an idempotency key and refreshes", async () => {
    mockApiPost.mockResolvedValue({});
    render(<CreatePoolButton org="mergefi" repo="frontend" />);
    openForm();
    fireEvent.change(screen.getByPlaceholderText("e.g. Critical bug fixes"), {
      target: { value: "  Bug fixes  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Pool created successfully!")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    const [path, body, idempotencyKey] = mockApiPost.mock.calls[0];
    expect(path).toBe("/maintenance-pools");
    expect(body).toMatchObject({
      name: "Bug fixes",
      asset: "USDC",
      repo: "mergefi/frontend",
      initialDeposit: 100,
    });
    expect(typeof idempotencyKey).toBe("string");
    expect(idempotencyKey).not.toHaveLength(0);
    expect(body.idempotencyKey).toBe(idempotencyKey);
  });

  it("uses a fresh idempotency key for each new attempt", async () => {
    mockApiPost.mockRejectedValueOnce(new Error("boom")).mockResolvedValue({});
    render(<CreatePoolButton />);
    openForm();
    fireEvent.change(screen.getByPlaceholderText("e.g. Critical bug fixes"), {
      target: { value: "Pool" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await screen.findByText("boom");
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledTimes(2));
    expect(mockApiPost.mock.calls[0][2]).not.toBe(mockApiPost.mock.calls[1][2]);
  });

  it("renders a failed request as an error instead of rejecting", async () => {
    mockApiPost.mockRejectedValue(new Error("Pool limit reached"));
    render(<CreatePoolButton />);
    openForm();
    fireEvent.change(screen.getByPlaceholderText("e.g. Critical bug fixes"), {
      target: { value: "Pool" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Pool limit reached")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create" })).not.toBeDisabled();
  });
});

describe("AssignRewardButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderAndOpen() {
    render(<AssignRewardButton poolId="pool-1" bountyId="b1" bountyTitle="Fix the bug" />);
    fireEvent.click(screen.getByRole("button", { name: "Assign reward" }));
  }

  it("shows the bounty it is assigning to", () => {
    renderAndOpen();

    expect(screen.getByText("Bounty: Fix the bug")).toBeInTheDocument();
  });

  it("assigns the reward with an idempotency key", async () => {
    mockApiPost.mockResolvedValue({});
    renderAndOpen();
    fireEvent.click(screen.getByRole("button", { name: "Assign" }));

    expect(await screen.findByText("Reward assigned successfully!")).toBeInTheDocument();
    const [path, body, idempotencyKey] = mockApiPost.mock.calls[0];
    expect(path).toBe("/maintenance-pools/pool-1/assign-reward");
    expect(body).toMatchObject({ bountyId: "b1", amount: 50 });
    expect(typeof idempotencyKey).toBe("string");
    expect(body.idempotencyKey).toBe(idempotencyKey);
  });

  it("renders a failed assignment as an error", async () => {
    mockApiPost.mockRejectedValue(new Error("Insufficient pool balance"));
    renderAndOpen();
    fireEvent.click(screen.getByRole("button", { name: "Assign" }));

    expect(await screen.findByText("Insufficient pool balance")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
