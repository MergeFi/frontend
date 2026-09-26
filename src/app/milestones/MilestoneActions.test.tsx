import { fireEvent, render, screen } from "@testing-library/react";
import { PoolDepositButton } from "./MilestoneActions";

const mockRunWithWallet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/hooks/useWalletAction", () => ({
  useWalletAction: () => ({
    runWithWallet: mockRunWithWallet,
    connecting: false,
  }),
}));

describe("PoolDepositButton accessibility", () => {
  it("associates a deposit error with the amount input", async () => {
    mockRunWithWallet.mockResolvedValue({ ok: false, error: "Deposit failed." });
    render(<PoolDepositButton poolId="pool-3" />);

    const input = screen.getByLabelText("Deposit amount");
    fireEvent.click(screen.getByRole("button", { name: "Deposit to pool" }));

    const error = await screen.findByRole("alert");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });
});
