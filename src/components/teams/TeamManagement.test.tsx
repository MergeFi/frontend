/**
 * TeamManagement.test.tsx (#917)
 *
 * Team splits decide who gets paid, and the backend rewrites them
 * non-transactionally (MergeFi/backend#728), so the client-side guard is the
 * only thing standing between a user and a half-written split set. Covers:
 * submission is blocked unless splits total 100, the "Total" indicator agrees
 * with validateTeamSplits, and every write carries an idempotency key.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { validateTeamSplits } from "@/lib/utils";
import {
  AssignTeamToBountyButton,
  CreateTeamButton,
  EditTeamSplitsButton,
} from "./TeamManagement";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const mockApiPost = jest.fn();
const mockApiRequest = jest.fn();
jest.mock("@/lib/api", () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW";

const team = {
  id: "t1",
  name: "Core",
  members: [
    { address: "GAAA", percentage: 60 },
    { address: "GBBB", percentage: 40 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CreateTeamButton", () => {
  function openForm() {
    render(<CreateTeamButton />);
    fireEvent.click(screen.getByRole("button", { name: "Create team" }));
  }

  it("requires a team name before sending anything", () => {
    openForm();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByText("Team name is required.")).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("blocks submission when the splits do not total 100%", () => {
    openForm();
    fireEvent.change(screen.getByPlaceholderText("e.g. Frontend Team"), {
      target: { value: "Frontend" },
    });
    fireEvent.change(screen.getByPlaceholderText("G... wallet address"), {
      target: { value: ADDRESS },
    });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      screen.getByText("All members must have an address and the splits must total 100%."),
    ).toBeInTheDocument();
    expect(screen.getByText("Total: 60%")).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("creates the team with an idempotency key and refreshes", async () => {
    const created = { id: "t2", name: "Frontend", members: [] };
    mockApiPost.mockResolvedValue(created);
    const onCreated = jest.fn();
    render(<CreateTeamButton onCreated={onCreated} />);
    fireEvent.click(screen.getByRole("button", { name: "Create team" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. Frontend Team"), {
      target: { value: " Frontend " },
    });
    fireEvent.change(screen.getByPlaceholderText("G... wallet address"), {
      target: { value: ` ${ADDRESS} ` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
    const [path, body] = mockApiPost.mock.calls[0];
    expect(path).toBe("/teams");
    expect(body).toMatchObject({
      name: "Frontend",
      members: [{ address: ADDRESS, percentage: 100 }],
    });
    expect(typeof body.idempotencyKey).toBe("string");
    expect(body.idempotencyKey.length).toBeGreaterThan(0);
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText("Team created successfully!")).toBeInTheDocument();
  });

  it("shows the request error instead of rejecting unhandled", async () => {
    mockApiPost.mockRejectedValue(new Error("Backend said no"));
    openForm();
    fireEvent.change(screen.getByPlaceholderText("e.g. Frontend Team"), {
      target: { value: "Frontend" },
    });
    fireEvent.change(screen.getByPlaceholderText("G... wallet address"), {
      target: { value: ADDRESS },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Backend said no")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("EditTeamSplitsButton", () => {
  function openEditor() {
    render(<EditTeamSplitsButton team={team} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit splits" }));
  }

  it("shows a sum indicator that matches validateTeamSplits", () => {
    openEditor();
    const [first] = screen.getAllByRole("spinbutton");
    fireEvent.change(first, { target: { value: "50" } });

    const expected = validateTeamSplits([{ percentage: 50 }, { percentage: 40 }]);
    expect(screen.getByText(`Total: ${expected.sum}%`)).toBeInTheDocument();
  });

  it("blocks saving when the splits do not total 100%", () => {
    openEditor();
    const [first] = screen.getAllByRole("spinbutton");
    fireEvent.change(first, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const expected = validateTeamSplits([{ percentage: 50 }, { percentage: 40 }]);
    expect(expected.valid).toBe(false);
    expect(
      screen.getByText(expected.message ?? "Splits must total 100%."),
    ).toBeInTheDocument();
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("saves valid splits with PATCH and an idempotency key", async () => {
    const updated = { ...team, name: "Core" };
    mockApiRequest.mockResolvedValue(updated);
    const onUpdate = jest.fn();
    render(<EditTeamSplitsButton team={team} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit splits" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(updated));
    const [path, init] = mockApiRequest.mock.calls[0];
    expect(path).toBe("/teams/t1/splits");
    expect(init.method).toBe("PATCH");
    const body = JSON.parse(init.body);
    expect(body.members).toEqual([
      { address: "GAAA", percentage: 60 },
      { address: "GBBB", percentage: 40 },
    ]);
    expect(typeof body.idempotencyKey).toBe("string");
    expect(body.idempotencyKey.length).toBeGreaterThan(0);
    expect(refresh).toHaveBeenCalled();
  });
});

describe("AssignTeamToBountyButton", () => {
  it("assigns the team with an idempotency key", async () => {
    mockApiPost.mockResolvedValue(undefined);
    render(
      <AssignTeamToBountyButton
        teamId="t1"
        teamName="Core"
        bountyId="b9"
        bountyTitle="Fix login"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Assign Core to Fix login" }));

    expect(await screen.findByText("Team assigned successfully!")).toBeInTheDocument();
    const [path, body] = mockApiPost.mock.calls[0];
    expect(path).toBe("/teams/t1/assign/b9");
    expect(typeof body.idempotencyKey).toBe("string");
  });
});
