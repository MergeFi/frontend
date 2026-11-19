import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useSmartPolling } from './useSmartPolling';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useSmartPolling', () => {
  it('fetches data immediately on mount', async () => {
    const fetchFn = vi.fn().mockResolvedValue('hello');
    const { result } = renderHook(() =>
      useSmartPolling({ fetchFn, intervalMs: 1000 }),
    );

    await act(async () => { await Promise.resolve(); });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('hello');
  });

  it('polls on the interval', async () => {
    const fetchFn = vi.fn().mockResolvedValue('x');
    renderHook(() => useSmartPolling({ fetchFn, intervalMs: 1000 }));

    await act(async () => { await Promise.resolve(); });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('does not stop polling when fetchFn changes identity between renders (#878)', async () => {
    let callCount = 0;

    // Re-render with a NEW inline fetchFn on every render (simulates parent re-renders).
    const { rerender } = renderHook(() =>
      useSmartPolling({
        fetchFn: () => Promise.resolve(++callCount),
        intervalMs: 500,
      }),
    );

    await act(async () => { await Promise.resolve(); });
    expect(callCount).toBe(1);

    // Trigger a re-render — this produces a new fetchFn identity.
    rerender();

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    // Polling must still fire even though fetchFn changed identity.
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('stops polling when enabled becomes false', async () => {
    const fetchFn = vi.fn().mockResolvedValue('y');
    const { rerender } = renderHook(
      ({ enabled }) => useSmartPolling({ fetchFn, intervalMs: 500, enabled }),
      { initialProps: { enabled: true } },
    );

    await act(async () => { await Promise.resolve(); });
    const countAfterMount = fetchFn.mock.calls.length;

    rerender({ enabled: false });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(fetchFn.mock.calls.length).toBe(countAfterMount);
  });

  it('calls onDataChange when data changes', async () => {
    const onDataChange = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue('new-value');

    renderHook(() =>
      useSmartPolling({ fetchFn, intervalMs: 1000, onDataChange }),
    );

    await act(async () => { await Promise.resolve(); });

    expect(onDataChange).toHaveBeenCalledWith('new-value');
  });
});
