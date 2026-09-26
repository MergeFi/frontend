import { render, screen } from "@testing-library/react";
import { IssueActions } from "./IssueActions";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { apiPost } from "@/lib/api";
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

function makeBounty(status: BountyStatus, overrides: Partial<Bounty> = {}): Bounty {
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
  mockUseAuth.mockReturnValue({ user } as unknown as ReturnType<typeof useAuth>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWallet();
  mockUser();
  mockApiPost.mockResolvedValue(undefined as never);
});

describe("IssueActions — action buttons per bounty.status", () => {
  const buttonNames = () => screen.queryAllByRole("button").map((b) => b.textContent);

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
  ] as const)("%s → a single disabled '%s' button and no money-moving action", (status, label) => {
    render(<IssueActions bounty={makeBounty(status)} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent(label);
    expect(buttons[0]).toBeDisabled();
    expect(screen.queryByRole("button", { name: /fund|claim|refund/i })).not.toBeInTheDocument();
  });
});
