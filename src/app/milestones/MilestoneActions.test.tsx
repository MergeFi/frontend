import { render, screen } from "@testing-library/react";
import { PoolDepositButton } from "./MilestoneActions";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/hooks/useWalletAction", () => ({
  useWalletAction: () => ({ runWithWallet: jest.fn(), connecting: false }),
}));

describe("PoolDepositButton input precision", () => {
  it("uses seven-decimal native input steps for XLM", () => {
    render(<PoolDepositButton poolId="pool-1" asset="XLM" />);

    const input = screen.getByLabelText("Deposit amount");
    expect(input).toHaveAttribute("min", "0.0000001");
    expect(input).toHaveAttribute("step", "0.0000001");
  });

  it("keeps two-decimal native input steps for USDC", () => {
    render(<PoolDepositButton poolId="pool-2" asset="USDC" />);

    const input = screen.getByLabelText("Deposit amount");
    expect(input).toHaveAttribute("min", "0.01");
    expect(input).toHaveAttribute("step", "0.01");
  });
});
