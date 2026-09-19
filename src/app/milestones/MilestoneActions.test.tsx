import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MilestoneFundButton, PoolDepositButton } from "./MilestoneActions";
import { useWallet } from "@/context/WalletContext";
import { apiPost, ApiRequestError } from "@/lib/api";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/context/WalletContext", () => ({
  useWallet: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  apiPost: jest.fn(),
  ApiRequestError: class ApiRequestError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ApiRequestError";
    }
  },
}));

describe("MilestoneActions Component Suite", () => {
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh });
  });

  describe("MilestoneFundButton", () => {
    it("handles address mismatch guard", async () => {
      (useWallet as jest.Mock).mockReturnValue({
        address: "GABC...",
        connect: jest.fn(),
        connecting: false,
        addressMismatch: true,
        getError: jest.fn(),
      });

      render(<MilestoneFundButton milestoneId="m-1" milestoneName="Alpha Release" />);
      const btn = screen.getByRole("button", { name: /Fund milestone: Alpha Release/i });
      fireEvent.click(btn);

      expect(
        screen.getByText(/Freighter's active account has changed/i)
      ).toBeInTheDocument();
    });

    it("funds milestone successfully with connected wallet", async () => {
      (useWallet as jest.Mock).mockReturnValue({
        address: "GBOUND123",
        connect: jest.fn(),
        connecting: false,
        addressMismatch: false,
        getError: jest.fn(),
      });
      (apiPost as jest.Mock).mockResolvedValue({ success: true });

      render(<MilestoneFundButton milestoneId="m-1" />);
      const btn = screen.getByRole("button", { name: "Fund milestone" });
      fireEvent.click(btn);

      await waitFor(() => {
        expect(apiPost).toHaveBeenCalledWith(
          "/milestones/m-1/fund",
          expect.objectContaining({
            funderAddress: "GBOUND123",
          })
        );
      });
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe("PoolDepositButton", () => {
    it("validates amount input and enables deposit button", async () => {
      (useWallet as jest.Mock).mockReturnValue({
        address: "GBOUND123",
        connect: jest.fn(),
        connecting: false,
        addressMismatch: false,
        getError: jest.fn(),
      });
      (apiPost as jest.Mock).mockResolvedValue({ success: true });

      render(<PoolDepositButton poolId="p-1" poolRepo="Acme/Core" asset="USDC" />);
      const input = screen.getByLabelText("Deposit amount");
      fireEvent.change(input, { target: { value: "250.50" } });

      const btn = screen.getByRole("button", { name: /Deposit to pool: Acme\/Core/i });
      expect(btn).not.toBeDisabled();
      fireEvent.click(btn);

      await waitFor(() => {
        expect(apiPost).toHaveBeenCalledWith(
          "/maintenance-pools/p-1/deposit",
          expect.objectContaining({
            amount: "250.5",
            funderAddress: "GBOUND123",
          })
        );
      });
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("shows error when wallet fails to connect", async () => {
      (useWallet as jest.Mock).mockReturnValue({
        address: null,
        connect: jest.fn().mockResolvedValue(null),
        connecting: false,
        addressMismatch: false,
        getError: () => "User rejected connection request.",
      });

      render(<PoolDepositButton poolId="p-1" />);
      const btn = screen.getByRole("button", { name: "Deposit to pool" });
      fireEvent.click(btn);

      await waitFor(() => {
        expect(screen.getByText("User rejected connection request.")).toBeInTheDocument();
      });
    });
  });
});
