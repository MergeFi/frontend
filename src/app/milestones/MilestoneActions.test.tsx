/**
 * Tests for PoolDepositButton's amount input labelling (#236).
 *
 * The input previously had no <label>, aria-label or aria-labelledby, so a
 * screen reader announced only "number input, value 100". Sighted users infer
 * its purpose from the adjacent "Deposit" button; nobody else could.
 *
 * getByRole("spinbutton", { name }) is the assertion that matters here: it
 * resolves the input through its accessible name, so it fails if the label is
 * removed or its htmlFor stops matching the input's id.
 */

import { render, screen } from "@testing-library/react";
import { PoolDepositButton } from "./MilestoneActions";

// MilestoneActions imports @/lib/api, which pulls in @/lib/config and throws
// at module load unless NEXT_PUBLIC_STELLAR_NETWORK is set. Nothing here
// posts, so mocking the module out keeps the test independent of the env.
jest.mock("@/lib/api", () => ({
  apiPost: jest.fn(),
  ApiRequestError: class ApiRequestError extends Error {},
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: null, connect: jest.fn(), connecting: false }),
}));

describe("PoolDepositButton", () => {
  it("gives the amount input an accessible name", () => {
    render(<PoolDepositButton poolId="pool-1" />);

    expect(screen.getByRole("spinbutton", { name: "Deposit amount" })).toBeInTheDocument();
  });

  it("keeps the label visually hidden so the layout is unchanged", () => {
    render(<PoolDepositButton poolId="pool-1" />);

    expect(screen.getByText("Deposit amount")).toHaveClass("sr-only");
  });

  it("does not reuse one id across pools rendered on the same page", () => {
    render(
      <>
        <PoolDepositButton poolId="pool-1" />
        <PoolDepositButton poolId="pool-2" />
      </>,
    );

    const [first, second] = screen.getAllByRole("spinbutton", { name: "Deposit amount" });
    expect(first.id).not.toBe("");
    expect(first.id).not.toBe(second.id);
  });
});
