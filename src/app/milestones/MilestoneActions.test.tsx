/**
 * Tests for MilestoneFundButton and PoolDepositButton success notice & aria-live feedback (#422).
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MilestoneFundButton, PoolDepositButton } from "./MilestoneActions";
import { useWallet } from "@/context/WalletContext";
import { apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";

jest.mock("@/context/WalletContext", () => ({
  useWallet: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  apiPost: jest.fn(),
  ApiRequestError: class ApiRequestError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("MilestoneActions — success notice and aria-live polite feedback (#422)", () => {
  const mockRefresh = jest.fn();
  const mockConnect = jest.fn();
  const mockGetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh });
    (useWallet as jest.Mock).mockReturnValue({
      address: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      connect: mockConnect,
      connecting: false,
      addressMismatch: false,
      getError: mockGetError,
    });
  });

  describe("MilestoneFundButton", () => {
    it("renders success notice with aria-live polite after successful fund", async () => {
      (apiPost as jest.Mock).mockResolvedValueOnce({ ok: true });

      render(
        <MilestoneFundButton
          milestoneId="milestone-1"
          milestoneName="Deliver V1"
        />,
      );

      const fundButton = screen.getByRole("button", {
        name: "Fund milestone: Deliver V1",
      });
      fireEvent.click(fundButton);

      await waitFor(() => {
        const notice = screen.getByRole("status");
        expect(notice).toHaveAttribute("aria-live", "polite");
        expect(notice).toHaveTextContent(
          'Milestone "Deliver V1" funded on-chain successfully.',
        );
      });

      expect(apiPost).toHaveBeenCalledWith(
        "/milestones/milestone-1/fund",
        expect.objectContaining({
          funderAddress:
            "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        }),
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe("PoolDepositButton", () => {
    it("renders success notice with aria-live polite after successful deposit", async () => {
      (apiPost as jest.Mock).mockResolvedValueOnce({ ok: true });

      render(
        <PoolDepositButton
          poolId="pool-1"
          poolRepo="facebook/react"
          asset="USDC"
        />,
      );

      const depositButton = screen.getByRole("button", {
        name: "Deposit to pool: facebook/react",
      });
      fireEvent.click(depositButton);

      await waitFor(() => {
        const notice = screen.getByRole("status");
        expect(notice).toHaveAttribute("aria-live", "polite");
        expect(notice).toHaveTextContent(
          "Deposited 100 USDC to maintenance pool successfully.",
        );
      });

      expect(apiPost).toHaveBeenCalledWith(
        "/maintenance-pools/pool-1/deposit",
        expect.objectContaining({
          amount: "100",
          funderAddress:
            "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        }),
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
