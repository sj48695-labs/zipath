import { formatWonAmount, formatWonAmountOrFallback } from "./formatWonAmount";

describe("formatWonAmount", () => {
  it("만원 단위는 천 단위 구분자를 항상 같은 형태로 출력한다", () => {
    expect(formatWonAmount(1234)).toBe("1,234만원");
  });

  it("억 단위는 억과 잔여 금액을 고정 형식으로 출력한다", () => {
    expect(formatWonAmount(12345)).toBe("1억 2,345만원");
    expect(formatWonAmount(10000)).toBe("1억");
  });
});

describe("formatWonAmountOrFallback", () => {
  it("값이 없으면 거래 없음으로 표시한다", () => {
    expect(formatWonAmountOrFallback(null)).toBe("거래 없음");
    expect(formatWonAmountOrFallback(undefined)).toBe("거래 없음");
  });
});
