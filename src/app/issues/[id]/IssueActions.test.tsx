import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IssueActions } from "./IssueActions";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { apiPost, ApiRequestError } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { Bounty } from "@/types";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/context/WalletContext", () => ({
  useWallet: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  apiPost: jest.fn(),
  ApiRequestError: class ApiRequestError extends Error {},
}));

const mockBounty: Bounty = {
  id: "bounty-123",
  title: "Test Bounty",
  description: "Test Description",
  status: "open",
  reward: 500,
  asset: "USDC",
  createdAt: new Date().toISOString(),
  milestoneId: null,
  tags: [],
};

describe("IssueActions Component", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockConnect = jest.fn();
  const mockGetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
    });
    (useWallet as jest.Mock).mockReturnValue({
      address: null,
      connect: mockConnect,
      connecting: false,
      addressMismatch: false,
      networkMismatch: false,
      getError: mockGetError,
    });
    window.confirm = jest.fn();
  });

  describe("Rendering buttons by bounty status", () => {
    it("renders 'Fund this bounty' button when status is 'open'", () => {
      render(<IssueActions bounty={{ ...mockBounty, status: "open" }} />);
      expect(screen.getByRole("button", { name: /fund this bounty/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /claim this issue/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /refund sponsor/i })).not.toBeInTheDocument();
    });

    it("renders 'Claim this issue' and 'Refund sponsor' buttons when status is 'funded'", () => {
      render(<IssueActions bounty={{ ...mockBounty, status: "funded" }} />);
      expect(screen.getByRole("button", { name: /claim this issue/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /refund sponsor/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /fund this bounty/i })).not.toBeInTheDocument();
    });

    it("renders 'Refund sponsor' button when status is 'claimed'", () => {
      render(<IssueActions bounty={{ ...mockBounty, status: "claimed" }} />);
      expect(screen.getByRole("button", { name: /refund sponsor/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /claim this issue/i })).not.toBeInTheDocument();
    });

    it("renders disabled state label for terminal statuses", () => {
      const { rerender } = render(<IssueActions bounty={{ ...mockBounty, status: "paid" }} />);
      expect(screen.getByRole("button", { name: /payout complete/i })).toBeDisabled();

      rerender(<IssueActions bounty={{ ...mockBounty, status: "in_review" }} />);
      expect(screen.getByRole("button", { name: /awaiting pr merge/i })).toBeDisabled();

      rerender(<IssueActions bounty={{ ...mockBounty, status: "merged" }} />);
      expect(screen.getByRole("button", { name: /payout pending/i })).toBeDisabled();

      rerender(<IssueActions bounty={{ ...mockBounty, status: "refunded" }} />);
      expect(screen.getByRole("button", { name: /no action available/i })).toBeDisabled();
    });
  });

  describe("Wallet guard behavior (withWallet)", () => {
    it("blocks funding and displays alert error when addressMismatch is true", async () => {
      (useWallet as jest.Mock).mockReturnValue({
        address: "G123",
        connect: mockConnect,
        connecting: false,
        addressMismatch: true,
        networkMismatch: false,
        getError: mockGetError,
      });

      render(<IssueActions bounty={{ ...mockBounty, status: "open" }} />);
      fireEvent.click(screen.getByRole("button", { name: /fund this bounty/i }));

      expect(
        await screen.findByText(/Freighter's active account has changed/i)
      ).toBeInTheDocument();
      expect(mockConnect).not.toHaveBeenCalled();
      expect(apiPost).not.toHaveBeenCalled();
    });

    it("blocks funding and displays alert error when networkMismatch is true", async () => {
      (useWallet as jest.Mock).mockReturnValue({
        address: "G123",
        connect: mockConnect,
        connecting: false,
        addressMismatch: false,
        networkMismatch: true,
        getError: mockGetError,
      });

      render(<IssueActions bounty={{ ...mockBounty, status: "open" }} />);
      fireEvent.click(screen.getByRole("button", { name: /fund this bounty/i }));

      expect(
        await screen.findByText(/wallet is on the wrong network/i)
      ).toBeInTheDocument();
      expect(mockConnect).not.toHaveBeenCalled();
      expect(apiPost).not.toHaveBeenCalled();
    });

    it("shows specific wallet error if connect() resolves to null", async () => {
      mockConnect.mockResolvedValue(null);
      mockGetError.mockReturnValue("User rejected wallet connection.");

      render(<IssueActions bounty={{ ...mockBounty, status: "open" }} />);
      fireEvent.click(screen.getByRole("button", { name: /fund this bounty/i }));

      expect(
        await screen.findByText("User rejected wallet connection.")
      ).toBeInTheDocument();
      expect(apiPost).not.toHaveBeenCalled();
    });

    it("executes fund API post and displays success notice on valid wallet", async () => {
      (useWallet as jest.Mock).mockReturnValue({
        address: "G_CONNECTED_ADDRESS",
        connect: mockConnect,
        connecting: false,
        addressMismatch: false,
        networkMismatch: false,
        getError: mockGetError,
      });
      (apiPost as jest.Mock).mockResolvedValue({ success: true });

      render(<IssueActions bounty={{ ...mockBounty, status: "open" }} />);
      fireEvent.click(screen.getByRole("button", { name: /fund this bounty/i }));

      expect(
        await screen.findByText(/Escrow funded on-chain/i)
      ).toBeInTheDocument();
      expect(apiPost).toHaveBeenCalledWith(
        `/bounties/${mockBounty.id}/fund`,
        expect.objectContaining({ funderAddress: "G_CONNECTED_ADDRESS" })
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe("Claim Flow (handleClaim)", () => {
    it("redirects to /connect when user is not signed in", () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });

      render(<IssueActions bounty={{ ...mockBounty, status: "funded" }} />);
      fireEvent.click(screen.getByRole("button", { name: /claim this issue/i }));

      expect(mockPush).toHaveBeenCalledWith("/connect");
      expect(apiPost).not.toHaveBeenCalled();
    });

    it("calls claim API and shows notice when user is signed in", async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: "user-456", email: "dev@example.com" },
      });
      (apiPost as jest.Mock).mockResolvedValue({ success: true });

      render(<IssueActions bounty={{ ...mockBounty, status: "funded" }} />);
      fireEvent.click(screen.getByRole("button", { name: /claim this issue/i }));

      expect(
        await screen.findByText(/You've claimed this issue/i)
      ).toBeInTheDocument();
      expect(apiPost).toHaveBeenCalledWith(
        `/bounties/${mockBounty.id}/claim`,
        expect.objectContaining({ contributorId: "user-456" })
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe("Refund Flow (handleRefund)", () => {
    it("aborts refund if user cancels window.confirm prompt", () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      render(<IssueActions bounty={{ ...mockBounty, status: "funded" }} />);
      fireEvent.click(screen.getByRole("button", { name: /refund sponsor/i }));

      expect(window.confirm).toHaveBeenCalled();
      expect(apiPost).not.toHaveBeenCalled();
    });

    it("calls refund API and shows notice when window.confirm is accepted", async () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      (apiPost as jest.Mock).mockResolvedValue({ success: true });

      render(<IssueActions bounty={{ ...mockBounty, status: "funded" }} />);
      fireEvent.click(screen.getByRole("button", { name: /refund sponsor/i }));

      expect(window.confirm).toHaveBeenCalled();
      expect(
        await screen.findByText(/Escrowed funds were refunded to the sponsor/i)
      ).toBeInTheDocument();
      expect(apiPost).toHaveBeenCalledWith(
        `/bounties/${mockBounty.id}/refund`,
        expect.anything()
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
