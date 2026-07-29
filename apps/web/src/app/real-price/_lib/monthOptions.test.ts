import { buildRecentMonthOptions } from "./monthOptions";

describe("buildRecentMonthOptions", () => {
  it("returns recent months in descending order from the reference date", () => {
    const options = buildRecentMonthOptions(new Date("2026-07-28T12:00:00Z"), 3);

    expect(options).toEqual([
      { value: "202607", label: "2026년 7월" },
      { value: "202606", label: "2026년 6월" },
      { value: "202605", label: "2026년 5월" },
    ]);
  });

  it("pads month values to two digits", () => {
    const options = buildRecentMonthOptions(new Date("2026-01-15T00:00:00Z"), 2);

    expect(options).toEqual([
      { value: "202601", label: "2026년 1월" },
      { value: "202512", label: "2025년 12월" },
    ]);
  });
});
