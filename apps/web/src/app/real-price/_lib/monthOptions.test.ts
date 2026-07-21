import {
  buildMonthOptions,
  buildRealPriceMonthState,
  getInitialRealPriceMonthState,
} from "./monthOptions";

describe("buildMonthOptions", () => {
  it("기준 날짜부터 최근 12개월을 최신순으로 생성한다", () => {
    const options = buildMonthOptions(new Date("2026-07-15T12:00:00Z"));

    expect(options).toHaveLength(12);
    expect(options[0]).toEqual({ value: "202607", label: "2026년 7월" });
    expect(options[1]).toEqual({ value: "202606", label: "2026년 6월" });
    expect(options[11]).toEqual({ value: "202508", label: "2025년 8월" });
  });
});

describe("getInitialRealPriceMonthState", () => {
  it("SSR 첫 렌더에 사용할 빈 상태를 반환한다", () => {
    expect(getInitialRealPriceMonthState()).toEqual({
      dealYmd: "",
      trendFromMonth: "",
      trendToMonth: "",
    });
  });
});

describe("buildRealPriceMonthState", () => {
  it("첫 렌더에 사용할 month state를 안정적으로 계산한다", () => {
    const monthOptions = buildMonthOptions(new Date("2026-07-15T12:00:00Z"));

    expect(buildRealPriceMonthState(monthOptions)).toEqual({
      dealYmd: "202607",
      trendFromMonth: "202602",
      trendToMonth: "202607",
    });
  });

  it("month option 이 없으면 빈 초기 상태를 반환한다", () => {
    expect(buildRealPriceMonthState([])).toEqual({
      dealYmd: "",
      trendFromMonth: "",
      trendToMonth: "",
    });
  });
});
