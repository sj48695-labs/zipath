import {
  buildMonthOptions,
  buildRealPriceMonthDefaults,
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

describe("buildRealPriceMonthDefaults", () => {
  it("서버와 클라이언트 첫 렌더에 공유할 기본값을 고정된 기준으로 생성한다", () => {
    expect(buildRealPriceMonthDefaults(new Date("2026-07-15T12:00:00Z"))).toEqual({
      monthOptions: [
        { value: "202607", label: "2026년 7월" },
        { value: "202606", label: "2026년 6월" },
        { value: "202605", label: "2026년 5월" },
        { value: "202604", label: "2026년 4월" },
        { value: "202603", label: "2026년 3월" },
        { value: "202602", label: "2026년 2월" },
        { value: "202601", label: "2026년 1월" },
        { value: "202512", label: "2025년 12월" },
        { value: "202511", label: "2025년 11월" },
        { value: "202510", label: "2025년 10월" },
        { value: "202509", label: "2025년 9월" },
        { value: "202508", label: "2025년 8월" },
      ],
      dealYmd: "202607",
      trendFromMonth: "202602",
      trendToMonth: "202607",
    });
  });
});
