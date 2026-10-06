import { renderHook, act } from "@testing-library/react";
import { useSmartPolling } from "./useSmartPolling";

describe("useSmartPolling (#570)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("polls immediately on mount when enabled=true and sets isPolling=true", async () => {
    const fetchFn = jest.fn().mockResolvedValue({ status: "ok" });

    const { result } = renderHook(() =>
      useSmartPolling({
        fetchFn,
        interval: 3000,
        enabled: true,
      }),
    );

    expect(result.current.isPolling).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("does not start polling when mounted with enabled=false", async () => {
    const fetchFn = jest.fn().mockResolvedValue({ status: "ok" });

    const { result } = renderHook(() =>
      useSmartPolling({
        fetchFn,
        interval: 3000,
        enabled: false,
      }),
    );

    expect(result.current.isPolling).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(6000);
      await Promise.resolve();
    });

    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("toggling enabled: true -> false stops timer and sets isPolling=false", async () => {
    const fetchFn = jest.fn().mockResolvedValue({ counter: 1 });

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useSmartPolling({
          fetchFn,
          interval: 2000,
          enabled,
        }),
      { initialProps: { enabled: true } },
    );

    expect(result.current.isPolling).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Toggle enabled off
    rerender({ enabled: false });

    expect(result.current.isPolling).toBe(false);

    // Advancing timers should not trigger any new fetches
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.current.isPolling).toBe(false);
  });

  it("toggling enabled: false -> true restarts polling immediately", async () => {
    const fetchFn = jest.fn().mockResolvedValue({ counter: 1 });

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useSmartPolling({
          fetchFn,
          interval: 2000,
          enabled,
        }),
      { initialProps: { enabled: true } },
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Disable
    rerender({ enabled: false });
    expect(result.current.isPolling).toBe(false);

    // Re-enable after disable
    rerender({ enabled: true });

    expect(result.current.isPolling).toBe(true);
    // Should have fired immediately upon re-enabling
    expect(fetchFn).toHaveBeenCalledTimes(2);

    // Should continue polling on interval
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("does not update state or throw when unmounted while a request is in flight", async () => {
    let resolvePromise: (val: unknown) => void = () => {};
    const fetchFn = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { unmount } = renderHook(() =>
      useSmartPolling({
        fetchFn,
        interval: 3000,
        enabled: true,
      }),
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Unmount before fetch resolves
    unmount();

    // Resolve the promise after unmount
    await act(async () => {
      resolvePromise({ data: "done" });
      await Promise.resolve();
    });

    // Should gracefully finish without memory leak warning or exceptions
  });
});
