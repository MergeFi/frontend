import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IssueActions } from "./IssueActions";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { apiPost, ApiRequestError } from "@/lib/api";
import type { Bounty, BountyStatus } from "@/types";

const push = jest.fn();
const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));
jest.mock("@/context/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("@/context/WalletContext", () => ({ useWallet: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  apiPost: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;
const mockApiPost = apiPost as jest.MockedFunction<typeof apiPost>;

const connect = jest.fn();

function makeBounty(
  status: BountyStatus,
  overrides: Partial<Bounty> = {},
): Bounty {
  return {
    id: "bounty-1",
    title: "Fix the thing",
    description: "",
    reward: 250,
    asset: "USDC",
    difficulty: "beginner",
    status,
    org: "mergefi",
    repo: "frontend",
    issueNumber: 1,
    labels: [],
    deadline: null,
    ...overrides,
  } as Bounty;
}

function mockWallet(overrides: Record<string, unknown> = {}) {
  mockUseWallet.mockReturnValue({
    address: "GWALLET",
    connect,
    connecting: false,
    addressMismatch: false,
    networkMismatch: false,
    getError: () => null,
    ...overrides,
  } as unknown as ReturnType<typeof useWallet>);
}

function mockUser(user: { id: string } | null = { id: "user-1" }) {
  mockUseAuth.mockReturnValue({ user } as unknown as ReturnType<
    typeof useAuth
  >);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWallet();
  mockUser();
  mockApiPost.mockResolvedValue(undefined as never);
});

describe("IssueActions — action buttons per bounty.status", () => {
  const buttonNames = () =>
    screen.queryAllByRole("button").map((b) => b.textContent);

  it("open → only 'Fund this bounty'", () => {
    render(<IssueActions bounty={makeBounty("open")} />);
    expect(buttonNames()).toEqual(["Fund this bounty"]);
  });

  it("funded → 'Claim this issue' and 'Refund sponsor'", () => {
    render(<IssueActions bounty={makeBounty("funded")} />);
    expect(buttonNames()).toEqual(["Claim this issue", "Refund sponsor"]);
  });

  it("claimed → only 'Refund sponsor' (no second claim)", () => {
    render(<IssueActions bounty={makeBounty("claimed")} />);
    expect(buttonNames()).toEqual(["Refund sponsor"]);
  });

  it.each([
    ["in_review", "Awaiting PR merge"],
    ["merged", "Payout pending"],
    ["paid", "Payout complete"],
    ["refunded", "No action available"],
    ["expired", "No action available"],
  ] as const)(
    "%s → a single disabled '%s' button and no money-moving action",
    (status, label) => {
      render(<IssueActions bounty={makeBounty(status)} />);
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent(label);
      expect(buttons[0]).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: /fund|claim|refund/i }),
      ).not.toBeInTheDocument();
    },
  );
});

describe("IssueActions — fund (wallet-gated)", () => {
  it("funds with the connected wallet address, shows a notice and refreshes", async () => {
    const user = userEvent.setup();
    render(<IssueActions bounty={makeBounty("open")} />);
    await user.click(screen.getByRole("button", { name: "Fund this bounty" }));

    expect(mockApiPost).toHaveBeenCalledWith(
      "/bounties/bounty-1/fund",
      expect.objectContaining({
        funderAddress: "GWALLET",
        idempotencyKey: expect.any(String),
      }),
    );
    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent(/Escrow funded on-chain/);
    expect(notice).toHaveAttribute("aria-live", "polite");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("connects first when no wallet is connected", async () => {
    const user = userEvent.setup();
    connect.mockResolvedValueOnce("GNEWWALLET");
    mockWallet({ address: null });
    render(<IssueActions bounty={makeBounty("open")} />);
    await user.click(screen.getByRole("button", { name: "Fund this bounty" }));

    expect(connect).toHaveBeenCalledTimes(1);
    expect(mockApiPost).toHaveBeenCalledWith(
      "/bounties/bounty-1/fund",
      expect.objectContaining({ funderAddress: "GNEWWALLET" }),
    );
  });

  it.each([
    [{ addressMismatch: true }, /active account has changed/],
    [{ networkMismatch: true }, /wrong network/],
  ])(
    "blocks funding when %o — no connect, no apiPost, error shown",
    async (flags, message) => {
      const user = userEvent.setup();
      mockWallet(flags);
      render(<IssueActions bounty={makeBounty("open")} />);
      await user.click(
        screen.getByRole("button", { name: "Fund this bounty" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(connect).not.toHaveBeenCalled();
      expect(mockApiPost).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  it("shows the connect error when the wallet connection is declined", async () => {
    const user = userEvent.setup();
    connect.mockResolvedValueOnce(null);
    mockWallet({ address: null });
    render(<IssueActions bounty={makeBounty("open")} />);
    await user.click(screen.getByRole("button", { name: "Fund this bounty" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Connect a Stellar wallet to continue.",
    );
    expect(mockApiPost).not.toHaveBeenCalled();
  });
});

describe("IssueActions — claim", () => {
  it("redirects signed-out users to /connect without calling the API", async () => {
    const user = userEvent.setup();
    mockUser(null);
    render(<IssueActions bounty={makeBounty("funded")} />);
    await user.click(screen.getByRole("button", { name: "Claim this issue" }));

    expect(push).toHaveBeenCalledWith("/connect");
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("claims as the signed-in user and shows a notice", async () => {
    const user = userEvent.setup();
    render(<IssueActions bounty={makeBounty("funded")} />);
    await user.click(screen.getByRole("button", { name: "Claim this issue" }));

    expect(mockApiPost).toHaveBeenCalledWith(
      "/bounties/bounty-1/claim",
      expect.objectContaining({
        contributorId: "user-1",
        idempotencyKey: expect.any(String),
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      /You've claimed this issue/,
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("renders the API error message in a role=alert", async () => {
    const user = userEvent.setup();
    mockApiPost.mockRejectedValueOnce(
      new ApiRequestError("Bounty already claimed", 409),
    );
    render(<IssueActions bounty={makeBounty("funded")} />);
    await user.click(screen.getByRole("button", { name: "Claim this issue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bounty already claimed",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("falls back to a generic message for non-API errors", async () => {
    const user = userEvent.setup();
    mockApiPost.mockRejectedValueOnce(new Error("socket hang up"));
    render(<IssueActions bounty={makeBounty("funded")} />);
    await user.click(screen.getByRole("button", { name: "Claim this issue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong.",
    );
  });
});

describe("IssueActions — refund (confirm-gated)", () => {
  let confirmSpy: jest.SpyInstance;
  beforeEach(() => {
    confirmSpy = jest.spyOn(window, "confirm");
  });
  afterEach(() => confirmSpy.mockRestore());

  it("does nothing when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    confirmSpy.mockReturnValue(false);
    render(<IssueActions bounty={makeBounty("funded")} />);
    await user.click(screen.getByRole("button", { name: "Refund sponsor" }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(mockApiPost).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("asks for confirmation with the amount, then refunds once confirmed", async () => {
    const user = userEvent.setup();
    confirmSpy.mockReturnValue(true);
    render(<IssueActions bounty={makeBounty("claimed")} />);
    await user.click(screen.getByRole("button", { name: "Refund sponsor" }));

    expect(confirmSpy.mock.calls[0][0]).toMatch(/cannot be undone/);
    expect(confirmSpy.mock.calls[0][0]).toMatch(/250/);
    expect(mockApiPost).toHaveBeenCalledWith(
      "/bounties/bounty-1/refund",
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect(confirmSpy.mock.invocationCallOrder[0]).toBeLessThan(
      mockApiPost.mock.invocationCallOrder[0],
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      /refunded to the sponsor/,
    );
  });
});
