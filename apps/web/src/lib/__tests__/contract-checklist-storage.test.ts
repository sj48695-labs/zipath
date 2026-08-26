import {
  readCheckedItems,
  saveCheckedItems,
} from "../contract-checklist-storage";

describe("contract checklist storage", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => storage.set(key, value),
        },
      },
    });
  });

  it("restores checked items separately for each contract type", () => {
    saveCheckedItems("월세", new Set(["deposit", "monthly-rent"]));
    saveCheckedItems("전세", new Set(["deposit-return"]));

    expect(readCheckedItems("월세")).toEqual(new Set(["deposit", "monthly-rent"]));
    expect(readCheckedItems("전세")).toEqual(new Set(["deposit-return"]));
  });
});
