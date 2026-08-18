import { renderHook } from "@testing-library/react";
import { useCrossTabStorage } from "./useCrossTabStorage";

function dispatchStorageEvent(key: string | null, newValue: string | null) {
  window.dispatchEvent(
    new StorageEvent("storage", { key, newValue, storageArea: window.localStorage }),
  );
}

describe("useCrossTabStorage", () => {
  it("invokes onChange with the new value when the watched key changes", () => {
    const onChange = jest.fn();
    renderHook(() => useCrossTabStorage("watched_key", onChange));

    dispatchStorageEvent("watched_key", "new-value");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("new-value");
  });

  it("invokes onChange with null when the watched key is removed", () => {
    const onChange = jest.fn();
    renderHook(() => useCrossTabStorage("watched_key", onChange));

    dispatchStorageEvent("watched_key", null);

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("ignores storage events for unrelated keys", () => {
    const onChange = jest.fn();
    renderHook(() => useCrossTabStorage("watched_key", onChange));

    dispatchStorageEvent("some_other_key", "whatever");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes its listener on unmount", () => {
    const onChange = jest.fn();
    const { unmount } = renderHook(() => useCrossTabStorage("watched_key", onChange));

    unmount();
    dispatchStorageEvent("watched_key", "after-unmount");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("re-subscribes under the new key when the key argument changes", () => {
    const onChange = jest.fn();
    const { rerender } = renderHook(
      ({ key }: { key: string }) => useCrossTabStorage(key, onChange),
      { initialProps: { key: "key_a" } },
    );

    rerender({ key: "key_b" });

    dispatchStorageEvent("key_a", "should-be-ignored-now");
    expect(onChange).not.toHaveBeenCalled();

    dispatchStorageEvent("key_b", "should-fire");
    expect(onChange).toHaveBeenCalledWith("should-fire");
  });
});
