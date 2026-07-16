import { formatWonAmount } from "./formatWonAmount";

describe("formatWonAmount", () => {
  it("formats values under 1억 in Korean locale", () => {
    expect(formatWonAmount(9999)).toBe("9,999만원");
  });

  it("formats values at 1억 exactly", () => {
    expect(formatWonAmount(10000)).toBe("1억");
  });

  it("formats values above 1억 with a comma-separated remainder", () => {
    expect(formatWonAmount(12345)).toBe("1억 2,345만원");
  });
});
